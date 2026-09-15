#!/usr/bin/env ruby
# Secure, dependency-free source validation for the static course.
# Runs in the same Ruby image used by Jekyll CI.
require 'yaml'
require 'json'
require 'open3'
require 'tempfile'
require 'cgi'
require 'date'

ROOT = File.expand_path('..', __dir__)
FAILURES = []
PASSES = []

def check(label, condition, detail = nil)
  if condition
    PASSES << label
  else
    FAILURES << [label, detail].compact.join(' — ')
  end
end

def text(path)
  File.read(File.join(ROOT, path), encoding: 'UTF-8')
end

def files(glob)
  Dir.glob(File.join(ROOT, glob)).select { |p| File.file?(p) }
end

course = YAML.safe_load(text('_data/course.yml'), aliases: true)
submission = YAML.safe_load(text('_data/submission.yml'), aliases: true)
quizzes = JSON.parse(text('_data/quizzes.json'))
achievements = JSON.parse(text('_data/achievements.json'))

check('course.yml parsed', course.is_a?(Hash))
check('submission.yml parsed', submission.is_a?(Hash))
check('quizzes.json parsed', quizzes.is_a?(Hash))
check('achievements.json parsed', achievements.is_a?(Hash))

ready = %w[lx0 lx1 lx2 lx3 lx4 lx5 lx6 lx7]
ready.each do |lab|
  lab_data = submission.dig('labs', lab)
  lab_md_path = "labs/#{lab}.md"
  lab_md = text(lab_md_path)
  check("#{lab}: submission data present", lab_data.is_a?(Hash))
  route = lab_data.fetch('route', [])
  evidence = lab_data.fetch('evidence', [])
  check("#{lab}: five learning stages", route.size == 5, "found #{route.size}")
  check("#{lab}: unique route numbers", route.map { |x| x['n'].to_s }.uniq.size == route.size)
  check("#{lab}: route anchors exist", route.all? { |x| lab_md.match?(/(?:id=[\"']#{Regexp.escape(x['anchor'].to_s)}[\"']|^#+\s+.*\{##{Regexp.escape(x['anchor'].to_s)}\})/m) })
  evidence.reject { |e| e['id'].to_s.end_with?('-Q') }.each do |e|
    check("#{lab}: evidence #{e['id']} appears in lab", lab_md.include?(e['id'].to_s))
  end
end

expected_quiz_counts = {'lx0'=>10, 'lx1'=>12, 'lx2'=>12, 'lx3'=>12, 'lx4'=>12, 'lx5'=>12, 'lx6'=>12, 'lx7'=>12, 'foundation'=>12}
expected_quiz_counts.each do |id, count|
  rows = quizzes[id]
  check("#{id}: quiz count #{count}", rows.is_a?(Array) && rows.size == count, "found #{rows&.size}")
  next unless rows.is_a?(Array)
  ids = rows.map { |q| q['id'] }
  check("#{id}: unique question ids", ids.compact.uniq.size == rows.size)
  check("#{id}: every question has explanation", rows.all? { |q| q['explain'].to_s.strip.length >= 12 })
  check("#{id}: answer indexes valid", rows.all? { |q| q['options'].is_a?(Array) && q['answer'].is_a?(Integer) && q['answer'].between?(0, q['options'].size - 1) })
  include_html = text("_includes/quizzes/#{id}.html")
  cards = include_html.scan(/<section class="quiz-card".*?<\/section>/m)
  check("#{id}: static quiz cards match count", cards.size == count, "found #{cards.size}")
  rows.each_with_index do |q, i|
    card = cards[i].to_s
    # Compare student-visible text after decoding HTML entities rather than raw
    # source bytes. Static includes legitimately encode apostrophes and angle
    # brackets, so raw CGI.escapeHTML comparisons produce false failures.
    card_text = CGI.unescapeHTML(card.gsub(/<[^>]+>/, ' ')).gsub(/\s+/, ' ').strip
    normalize = ->(value) { value.to_s.gsub(/\s+/, ' ').strip }
    check("#{id}: static answer #{i+1}", card.include?("data-answer=\"#{q['answer']}\""))
    check("#{id}: static question #{i+1}", card_text.include?(normalize.call(q['q'])))
    check("#{id}: static explanation #{i+1}", card_text.include?(normalize.call(q['explain'])))
    q.fetch('options', []).each_with_index do |opt, oi|
      check("#{id}: static option #{i+1}.#{oi+1}", card_text.include?(normalize.call(opt)))
    end
  end
end

# Public achievement-board data must remain privacy-minimized and instructor-approved.
ready_codes = course.fetch('lessons', []).select { |x| x['ready'] }.map { |x| x['code'].to_s.upcase }
allowed_labs = achievements.fetch('allowed_labs', []).map { |x| x.to_s.upcase }
check('achievement board allowed labs match ready labs', allowed_labs.sort == ready_codes.sort, "board=#{allowed_labs.inspect} ready=#{ready_codes.inspect}")
check('achievement board requires explicit opt-in', achievements.dig('privacy', 'require_consent') == true)
badges = achievements.fetch('badges', {})
check('achievement board defines accepted badge', badges.key?('accepted'))
allowed_tones = %w[green blue teal gold violet]
check('achievement badge tones are allowlisted', badges.values.all? { |b| allowed_tones.include?(b['tone'].to_s) })
public_keys = %w[lab date group number badge approved]
forbidden_keys = %w[name full_name student_name fio email score grade mcq retries completeness evidence answers screenshots output comment]
achievements.fetch('entries', []).each_with_index do |entry, idx|
  check("achievement #{idx+1}: only public allowlist fields", (entry.keys - public_keys).empty?, "extra=#{(entry.keys - public_keys).inspect}")
  forbidden_keys.each { |field| check("achievement #{idx+1}: excludes #{field}", !entry.key?(field)) }
  check("achievement #{idx+1}: approved only", entry['approved'] == true)
  check("achievement #{idx+1}: known lab", allowed_labs.include?(entry['lab'].to_s.upcase))
  check("achievement #{idx+1}: known badge", badges.key?(entry['badge'].to_s))
  check("achievement #{idx+1}: list number 1..999", entry['number'].to_i.between?(1,999))
  check("achievement #{idx+1}: safe group id", entry['group'].to_s.match?(/\A[\p{L}\p{N}_.-]{1,40}\z/u))
  begin
    Date.iso8601(entry['date'].to_s)
    date_ok = true
  rescue ArgumentError
    date_ok = false
  end
  check("achievement #{idx+1}: ISO date", date_ok)
end
check('achievement board renderer exists', File.exist?(File.join(ROOT, '_includes/achievement-board.html')))
check('achievement board uses instructor-approved entries', text('_includes/achievement-board.html').include?("where: 'approved', true"))
check('achievement board does not render full name', !text('_includes/achievement-board.html').match?(/student.?name|fio|ФИО/i))
check('report builder embeds board consent metadata', text('assets/js/report-builder.js').include?('NSA.PublicBoardConsent'))
check('report builder embeds no full name in custom properties', !text('assets/js/report-builder.js').match?(/NSA\.(?:Name|StudentName|FIO)/i))
check('instructor achievement importer exists', File.exist?(File.join(ROOT, 'tools/publish_achievements.py')))

layout = text('_layouts/default.html')
required_csp = ["default-src 'self'", "script-src 'self'", "script-src-attr 'none'", "connect-src 'none'", "object-src 'none'", "frame-src 'none'", "form-action 'none'"]
required_csp.each { |d| check("CSP contains #{d}", layout.include?(d)) }
check('no HTML form in course source', files('**/*.{html,md}').none? { |p| File.read(p, encoding:'UTF-8').match?(/<form\b/i) })

js_paths = files('assets/js/*.js')
js_all = js_paths.map { |p| File.read(p, encoding:'UTF-8') }.join("\n")
{
  'eval(' => /\beval\s*\(/,
  'new Function' => /\bnew\s+Function\b/,
  'document.write' => /document\.write\s*\(/,
  'innerHTML' => /\.innerHTML\b/,
  'outerHTML' => /\.outerHTML\b/,
  'insertAdjacentHTML' => /insertAdjacentHTML\s*\(/
}.each do |name, re|
  check("JS avoids #{name}", !js_all.match?(re))
end
check('JS avoids inline style mutation under strict CSP', !js_all.match?(/\.style\.|setAttribute\(\s*['"]style['"]/))

network_re = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/
student_data_js = %w[assets/js/evidence-pad.js assets/js/report-builder.js].map { |p| text(p) }.join("\n")
check('student evidence/report modules contain no network API', !student_data_js.match?(network_re))
check('learning progress uses namespaced localStorage', text('assets/js/progress.js').include?('nsa-learning-progress:v1:'))
check('report completeness summary is namespaced', text('assets/js/report-builder.js').include?('nsa-submission-completeness:v1:'))
check('home reads report completeness summary', text('assets/js/progress.js').include?('getCompleteness'))
check('home card renders completeness marker', text('_includes/course-home.html').include?('data-home-completeness-text'))
report_js = text('assets/js/report-builder.js')
check('report localStorage summary excludes identity fields', !report_js.match?(/safeLocalSet\([^\n]*(?:studentName|group|number|answer|evidenceText)/))
summary_block = report_js[/const summary = \{.*?\n      \};/m].to_s
%w[studentName group listNumber answer answers output evidenceText files screenshots].each do |field|
  check("persistent completeness summary excludes #{field}", !summary_block.match?(/\b#{Regexp.escape(field)}\b/i))
end
check('image validation checks PNG/JPEG magic bytes', report_js.include?('pngMagic') && report_js.include?('jpegMagic'))
check('image validation requires browser-readable image', report_js.include?('if (!meta.readable)'))
check('generated OOXML escapes user-controlled text', report_js.include?(".replace(/&/g, '&amp;')") && report_js.include?('esc(line'))

# External navigation must not get an opener; executable assets must remain local.
files('**/*.{html,md}').each do |p|
  File.readlines(p, encoding:'UTF-8').each_with_index do |line, idx|
    if line.include?('target="_blank"')
      check("noopener/noreferrer #{p.sub(ROOT+'/', '')}:#{idx+1}", line.include?('rel="noopener noreferrer"'))
    end
    if line.match?(/<script\b[^>]*src=[\"']https?:\/\//i)
      check("no external scripts #{p.sub(ROOT+'/', '')}:#{idx+1}", false)
    end
  end
end

# Course code should not normalize dangerous shortcuts into teaching patterns.
course_text = files('{labs,_includes,_data}/**/*.{md,html,yml,yaml}').map { |p| File.read(p, encoding:'UTF-8') }.join("\n")
bash_authored = files('labs/*.md').map { |p| File.read(p, encoding:'UTF-8').scan(/```bash\s*\n(.*?)\n```/m).flatten.join("\n") }.join("\n")
check('no chmod 777 command in Bash blocks', !bash_authored.match?(/\bchmod\s+(?:-R\s+)?777\b/))
check('no curl/wget pipe-to-shell pattern', !course_text.match?(/\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:sh|bash)\b/))
check('no disabled SSH host-key checking', !course_text.match?(/StrictHostKeyChecking\s*=\s*no/i))
check('no sample Ivanov/Petrov names', !course_text.match?(/\b(?:Ivanov|Petrov|Иванов|Петров|Ivan\s+Ivanov)\b/i))

# LX1 pedagogy gate: first contact with the shell must teach one logical command at a time.
lx1_text = text('labs/lx1.md')
lx1_shell_blocks = lx1_text.scan(/```bash\s*\n(.*?)\n```/m).flatten
lx1_dense_blocks = lx1_shell_blocks.each_with_index.select do |block, _idx|
  block.lines.count { |line| !line.strip.empty? && !line.lstrip.start_with?('#') } > 1
end
check('lx1: shell teaching blocks contain one command line', lx1_dense_blocks.empty?, lx1_dense_blocks.first && "block #{lx1_dense_blocks.first[1] + 1}")
check('lx1: teaches command anatomy before practice', lx1_text.include?('имя команды   опция программы   операнд / путь') && lx1_text.include?('help cd') && lx1_text.include?('man ls'))
check('lx1: teaches absolute/relative path model', lx1_text.include?('Абсолютный путь') && lx1_text.include?('Относительный путь') && lx1_text.include?('..') && lx1_text.include?('~'))
check('lx1: uses compact labelled evidence collectors', %w[WORKSPACE= PASSWD_RECORD= PIPELINE= SYMLINK_TARGET=].all? { |token| lx1_text.include?(token) })
check('lx1: avoids full terminal transcript evidence', lx1_text.include?('Полный журнал терминала не нужен') && lx1_text.include?('не умение копировать длинный терминальный журнал'))

# LX2 pedagogy gate: beginner command cells teach one logical command at a time.
lx2_text = text('labs/lx2.md')
lx2_shell_blocks = lx2_text.scan(/```(?:bash|powershell)\s*\n(.*?)\n```/m).flatten
lx2_dense_blocks = lx2_shell_blocks.each_with_index.select do |block, _idx|
  block.lines.count { |line| !line.strip.empty? && !line.lstrip.start_with?('#') } > 1
end
check('lx2: shell teaching blocks contain one command line', lx2_dense_blocks.empty?, lx2_dense_blocks.first && "block #{lx2_dense_blocks.first[1] + 1}")
check('lx2: uses compact labelled evidence collectors', %w[SSH_SERVICE REMOTE_USER AUTH=publickey AFTER_RECONNECT].all? { |token| lx2_text.include?(token) })
check('lx2: avoids full terminal transcript evidence', lx2_text.include?('весь терминальный журнал не нужен') && lx2_text.include?('Полный журнал установки APT не нужен'))

# LX4 safety gates: process experiments must stay controlled and package changes minimal.
lx4_text = text('labs/lx4.md')
lx4_bash = lx4_text.scan(/```bash\s*\n(.*?)\n```/m).flatten.join("\n")
check('lx4: package change is simulated before install', lx4_text.include?('apt-get -s install htop'))
check('lx4: avoids system-wide upgrade in Bash', !lx4_bash.match?(/\bapt(?:-get)?\s+(?:full-upgrade|dist-upgrade|upgrade)\b/))
check('lx4: avoids blind autoremove in Bash', !lx4_bash.match?(/\bapt(?:-get)?\s+autoremove\b/))
check('lx4: avoids SIGKILL/kill -9 in Bash', !lx4_bash.match?(/\bkill\s+(?:-9|-KILL|-s\s+KILL)\b/))
check('lx4: avoids broad pkill/killall commands', !lx4_bash.match?(/\b(?:pkill|killall)\b/))
check('lx4: checks saved PID identity before signals', lx4_text.include?('ps -o pid,user,comm,args -p "$LAB_PID"'))
check('lx4: package cleanup respects pre-lab state', lx4_text.include?('HTOP_BEFORE=not-installed') && lx4_text.include?('kept-preexisting-install'))

# LX5 safety/academic gates: systemd changes must remain isolated to the training unit.
lx5_text = text('labs/lx5.md')
lx5_bash = lx5_text.scan(/```bash\s*\n(.*?)\n```/m).flatten.join("\n")
check('lx5: uses dedicated training service', lx5_text.include?('lx5-heartbeat.service'))
check('lx5: verifies unit before lifecycle', lx5_text.include?('systemd-analyze verify'))
check('lx5: separates enable from start', lx5_text.include?('ACTIVE_AFTER_ENABLE') && lx5_text.include?('AFTER_START_ACTIVE'))
check('lx5: teaches journal diagnostics', lx5_text.include?('journalctl -u lx5-heartbeat.service'))
check('lx5: runs service as non-root user', lx5_text.include?('User=$SERVICE_USER'))
check('lx5: includes baseline service hardening', lx5_text.include?('NoNewPrivileges=yes') && lx5_text.include?('ProtectSystem=strict') && lx5_text.include?('ProtectHome=yes'))
check('lx5: avoids dangerous isolate/set-default/mask in Bash', !lx5_bash.match?(/\bsystemctl\s+(?:isolate|set-default|mask)\b/))
check('lx5: avoids reboot in mandatory Bash path', lx5_text.split('<details class="optional-work"', 2).first.to_s !~ /\bsudo\s+reboot\b/)
check('lx5: cleanup only targets training unit', lx5_text.include?('disable --now lx5-heartbeat.service') && lx5_text.include?('rm -f /etc/systemd/system/lx5-heartbeat.service'))
check('lx5: uses Type=exec with modern rationale', lx5_text.include?('Type=exec') && lx5_text.include?('Type=simple'))


# LX6 safety/academic gates: destructive storage work must stay inside the verified loop image.
lx6_text = text('labs/lx6.md')
lx6_bash = lx6_text.scan(/```bash\s*\n(.*?)\n```/m).flatten.join("\n")
check('lx6: uses dedicated image and loop device', lx6_text.include?('lx6-ext4.img') && lx6_text.include?('losetup --find --show --nooverlap'))
check('lx6: verifies loop backing before mkfs', lx6_text.include?('LOOP_BACKING_CHECK=OK') && lx6_text.include?('readlink -f'))
check('lx6: mkfs targets loop variable only', lx6_bash.scan(/\bmkfs(?:\.ext4)?\b[^\n]*/).all? { |line| line.include?('$LOOPDEV') })
check('lx6: avoids partition editors in mandatory Bash', !lx6_bash.match?(/\b(?:fdisk|cfdisk|sfdisk|parted|gdisk)\b/))
check('lx6: avoids wipefs in mandatory Bash', !lx6_bash.match?(/\bwipefs\b/))
check('lx6: dd never writes to block device', !lx6_bash.match?(/\bdd\b[^\n]*\bof=\/dev\//))
check('lx6: does not edit system fstab', !lx6_bash.match?(/(?:>|>>|tee)\s*\/etc\/fstab/))
check('lx6: verifies alternative fstab', lx6_text.include?('findmnt --verify --tab-file') && lx6_text.include?('mount --all --fstab'))
check('lx6: cleanup detaches only loop pattern', lx6_text.include?('/dev/loop[0-9]*') && lx6_text.include?('losetup --detach'))
check('lx6: NFS is taught without mandatory server mutation', lx6_text.include?('server:/export/path') && !lx6_bash.match?(/\bapt(?:-get)?\s+install\s+.*nfs|\bsystemctl\s+.*nfs-server/))


# LX7 safety/academic gates: scripting and scheduling must remain user-scoped and reversible.
lx7_text = text('labs/lx7.md')
lx7_bash = lx7_text.scan(/```bash\s*\n(.*?)\n```/m).flatten.join("\n")
check('lx7: uses explicit Bash interpreter', lx7_text.include?('#!/usr/bin/env bash'))
check('lx7: syntax-checks authored scripts', lx7_text.include?('bash -n ~/NSA/LX7/bin/hello.sh') && lx7_text.include?('bash -n ~/NSA/LX7/system-report.sh'))
check('lx7: teaches meaningful non-zero exit status', lx7_text.include?('INVALID_EXIT=2') && lx7_text.include?('exit 2'))
check('lx7: uses SHA-256 instead of MD5 in mandatory Bash', lx7_text.include?('sha256sum') && !lx7_bash.match?(/\bmd5sum\b/))
check('lx7: states checksum trust boundary', lx7_text.include?('не доказывает происхождение') || lx7_text.include?('не подтверждает автора'))
check('lx7: cron is user-scoped', lx7_text.include?('crontab -l') && !lx7_bash.match?(/\/etc\/(?:crontab|cron\.)/))
check('lx7: cron owns a delimited block', lx7_text.include?('NSA-LX7-BEGIN') && lx7_text.include?('NSA-LX7-END'))
check('lx7: avoids destructive crontab removal', !lx7_bash.match?(/\bcrontab\s+-r\b/))
check('lx7: cron task writes only to lab directory', lx7_text.include?('log="$HOME/NSA/LX7/cron.log"'))
check('lx7: no password/user creation exercises in mandatory Bash', !lx7_bash.match?(/\b(?:useradd|adduser|passwd)\b/))
check('lx7: PATH change is session-scoped', lx7_text.include?('export PATH="$HOME/NSA/LX7/bin:$PATH"') && !lx7_bash.match?(/(?:>>|tee -a).*\.(?:bashrc|profile|bash_profile)/))

# Syntax-check every fenced Bash block in the authored labs.
bash_total = 0
bash_fail = []
files('labs/*.md').each do |p|
  content = File.read(p, encoding:'UTF-8')
  content.scan(/```bash\s*\n(.*?)\n```/m).each_with_index do |m, idx|
    bash_total += 1
    Tempfile.create(['nsa-lab-', '.sh']) do |f|
      f.write(m[0]); f.flush
      _out, err, status = Open3.capture3('bash', '-n', f.path)
      bash_fail << "#{File.basename(p)} block #{idx+1}: #{err.strip}" unless status.success?
    end
  end
end
check("Bash blocks syntax (#{bash_total})", bash_fail.empty?, bash_fail.first)

# Templates must be valid ZIP-based DOCX packages.
files('assets/templates/*.docx').each do |p|
  ok = false
  begin
    _out, _err, status = Open3.capture3('unzip', '-tqq', p)
    ok = status.success?
  rescue Errno::ENOENT
    raw = File.binread(p)
    ok = raw.start_with?("PK\x03\x04".b) && raw.include?('[Content_Types].xml') && raw.include?('word/document.xml')
  end
  check("DOCX integrity #{File.basename(p)}", ok)
end

# DOCX templates must follow the canonical course workspace and avoid obsolete meta copy.
files('assets/templates/NSA_LX*_Report_Template.docx').each do |p|
  code = File.basename(p)[/NSA_(LX\d+)_/, 1]
  xml, _err, status = Open3.capture3('unzip', '-p', p, 'word/document.xml')
  flat = xml.force_encoding('UTF-8').gsub(/<[^>]+>/, '')
  check("DOCX workspace #{File.basename(p)}", status.success? && flat.include?("~/NSA/#{code}"))
  check("DOCX no legacy workspace #{File.basename(p)}", !flat.match?(%r{~/(?:labs/lx\d+|lx\d+-)}i))
end
report_builder = text('assets/js/report-builder.js')
check('generated DOCX: redundant Итог block removed', !report_builder.include?('Отчёт сформирован из учебной среды курса.'))
check('generated DOCX: canonical workspace included', report_builder.include?("['Рабочая папка', '~/NSA/' + data.labCode]"))

# Internal authoring/skill docs should not be published as course pages.
config = text('_config.yml')
%w[SKILL.md skills.md COURSE_DEEP_REVIEW.md SECURITY_REVIEW.md ACHIEVEMENT_BOARD.md qa tools teacher].each do |entry|
  check("Jekyll excludes #{entry}", config.include?(entry))
end
check('progress synchronization regression test exists', File.exist?(File.join(ROOT, 'qa/progress_sync_test.js')))


# Course-wide student workspace convention. Student-owned artifacts stay under ~/NSA/LXn.
files('labs/lx*.md').each do |lab_path|
  body = File.read(lab_path, encoding: 'UTF-8')
  id = File.basename(lab_path, '.md').upcase
  check("#{id.downcase}: no legacy home workspace path", !body.match?(%r{~/(?:labs/lx\d+|lx\d+-)}i))
end
check('lx0: initializes canonical NSA workspace', text('labs/lx0.md').include?('mkdir -p ~/NSA/LX0'))
check('lx1: uses canonical NSA workspace', text('labs/lx1.md').include?('mkdir -p ~/NSA/LX1/basic'))
check('global lab-start: displays canonical NSA workspace', text('_includes/lab-start.html').include?('~/NSA/{{ lab_code }}'))

puts "Course source QA: #{PASSES.size} PASS / #{FAILURES.size} FAIL"
PASSES.each { |x| puts "PASS  #{x}" }
unless FAILURES.empty?
  FAILURES.each { |x| warn "FAIL  #{x}" }
  exit 1
end
