# Публикация курса: GitLab Pages и SourceCraft Sites

Один набор исходных файлов можно хранить в обоих репозиториях. Каждая платформа запускает собственную сборку после получения изменений. Отправка в GitLab сама по себе не отправляет изменения в SourceCraft: нужен второй `git push` или настроенное зеркалирование.

## Что исправлено

- SourceCraft собирает ссылки с `baseurl`, вычисленным из имени репозитория в `SOURCECRAFT_REPO_URL`. Это соответствует адресу `https://<organization>.sourcecraft.site/<repository>/`.
- В SourceCraft установлен `JEKYLL_ENV: production`.
- Обе сборки проверяют главную страницу, LX0–LX7, итоговый тест и данные MCQ.
- Публикация SourceCraft работает при уже существующей ветке `release`, задаёт автора служебного коммита и проверяет наличие результатов сборки.
- Устаревшая сборка пропускает публикацию, если при проверке `main` уже указывает на другой коммит. Явный `--force-with-lease` отклоняет отправку, если ветка `release` изменилась после проверки; чужой результат не перезаписывается без проверки.
- `site/` исключён из исходных файлов Git и из входных файлов Jekyll. В публикации он добавляется принудительно только в ветку `release`.

Исходная структура `.sourcecraft/ci.yaml` допустима; менять `on.push` на список необязательно. Файл `.sourcecraft/sites.yaml` с `root: site` и `ref: release` уже был корректен.

## Применить обновление

Скопируйте файлы из архива в существующий локальный репозиторий, сохранив его историю Git. В архиве нет каталога `.git` и результатов локальных сборок.

Из корня репозитория:

```bash
git add .sourcecraft/ci.yaml .sourcecraft/sites.yaml .sourcecraft/publish.sh .gitlab-ci.yml .gitignore _config.yml DEPLOYMENT.md
git commit -m "Fix course publishing for GitLab and SourceCraft"
```

Отправьте коммит в `main` каждого нужного репозитория. Пример **только если** ваши удалённые репозитории уже называются `gitlab` и `sourcecraft`:

```bash
git push gitlab main
git push sourcecraft main
```

Если настроен только `origin`, используйте его для соответствующей платформы. Адрес второго репозитория берите из кнопки клонирования на этой платформе. Имя основной ветки SourceCraft должно быть `main`; при другом имени измените фильтр в `ci.yaml` и проверки ветки в `publish.sh` согласованно.

## GitLab Pages

1. В **Settings → CI/CD → Runners** проверьте, что проекту назначен работающий runner с тегом `edu-pages`. Runner должен поддерживать `image: ruby:3.3` (например, Docker executor).
2. После отправки коммита откройте **Build → Pipelines**. Задание `deploy-course` должно завершиться успешно.
3. Откройте **Deploy → Pages** и перейдите по опубликованному адресу.
4. Проверьте главную страницу, LX0, стили и тест MCQ.

Сборка берёт путь из `CI_PAGES_URL`; отдельно прописывать текущий адрес GitLab в `_config.yml` не нужно. Используется современный синтаксис `pages.publish` с автоматическим экспортом артефактов (GitLab 17.10+). Ваши существующие настройки `edu-pages`, `public` и правило основной ветки сохранены.

## SourceCraft Sites

1. Для Sites нужны **публичный репозиторий и публичная организация**. Проверьте их настройки и пригодность материалов для открытой публикации.
2. Файлы `.sourcecraft/ci.yaml`, `.sourcecraft/sites.yaml` и `.sourcecraft/publish.sh` должны попасть в основную ветку `main`.
3. Отправьте коммит и откройте **Code → CI/CD**. Дождитесь успешных `build-site` и `publish-site`.
4. Проверьте, что в ветке `release` появился `site/index.html`.
5. Откройте ссылку в **Deployments**. Обновление хостинга может занять несколько минут. Проверьте стили, переходы на лабораторные и MCQ.

SourceCraft выполняет два кубика последовательно в одной задаче. Результат контейнерной сборки сохраняется в общей рабочей папке, а отправка Git выполняется следующим кубиком на worker. Используется Git-аутентификация CI, предоставленная SourceCraft; не записывайте токены в YAML или URL репозитория.

`release` — ветка для автоматически созданного сайта. Вносите правки в `main`; не редактируйте `release` вручную и не сливайте её обратно в `main`. Скрипт обновляет `release` на основе текущего исходного коммита, поэтому для неё должен быть разрешён такой тип обновления. При отказе в доступе проверьте права исполнителя CI и правила защиты **именно этой ветки**.

## Если сборка не завершилась

| Симптом | Что проверить |
|---|---|
| GitLab: задание остаётся `pending` | Назначение runner проекту, тег `edu-pages`, доступ runner к основной ветке |
| SourceCraft: нет запуска | Конфигурация находится в основной ветке; фильтр совпадает с `main`; коммит действительно отправлен в SourceCraft |
| Ошибка установки Jekyll | Доступ worker к Docker Hub и RubyGems; полный журнал установки |
| `git push`: отказ в доступе | Права Git-аутентификации CI и защита ветки `release` |
| `stale info` / отказ lease | Параллельная сборка успела обновить `release`. Дождитесь последней сборки `main`; при необходимости перезапустите её |
| `Skipped: main has changed…` | Это старая сборка. Проверьте запуск для последнего коммита `main` |
| Сайт есть, но нет стилей | Проверяйте URL из Deployments, имя репозитория и `baseurl` в журнале сборки |
| SourceCraft: сайт недоступен после успешной сборки | Публичность организации/репозитория, `ref: release`, наличие `site/index.html`, задержку публикации |

## Проверка этой версии

- YAML прочитан и сопоставлен с официальным справочником; Bash-скрипт прошёл синтаксическую проверку.
- Выполнены команды сборки из обоих YAML, с путями `/network-systems-applications` и `/network-systems-applications-8b1f37`.
- Для каждой сборки проверены обязательные файлы и 99 локальных ссылок на страницы и ресурсы. В результат не попали `site/`, `public/` и служебный каталог SourceCraft.
- На временном локальном Git-репозитории проверены: первая и повторная публикация, отсутствие обязательного файла, запрет другой исходной ветки, конфликт параллельных публикаций и пропуск устаревшей сборки. Все проверки пройдены.
- Локальная среда проверки: Ruby 3.1 / Jekyll 4.3.1. Конфигурации CI используют Ruby 3.3 и Jekyll `~> 4.4`; установка этой версии и выполнение на ваших реальных runner/worker здесь не проверялись. Окончательное подтверждение — успешная сборка и открытие сайта на каждой платформе.

## Официальные справочники

- [GitLab: pages.publish](https://docs.gitlab.com/ci/yaml/#pagespublish)
- [SourceCraft: триггеры CI/CD](https://sourcecraft.dev/portal/docs/en/sourcecraft/ci-cd-ref/on)
- [SourceCraft: кубики и общая рабочая папка](https://sourcecraft.dev/portal/docs/en/sourcecraft/ci-cd-ref/cubes)
- [SourceCraft: переменные, включая SOURCECRAFT_REPO_URL](https://sourcecraft.dev/portal/docs/en/sourcecraft/ci-cd-ref/predefined-variables)
- [SourceCraft Sites: адрес и конфигурация](https://sourcecraft.dev/portal/docs/en/sourcecraft/concepts/sites)
- [SourceCraft: публикация сайта и требования к доступу](https://sourcecraft.dev/portal/docs/en/sourcecraft/tutorials/sites)
- [Git: force-with-lease](https://git-scm.com/docs/git-push#Documentation/git-push.txt---force-with-leaseltrefnamegtltexpectgt)

## 2026-09-03 cache update
The validated-completeness release uses asset version `20260903-6`. After deployment, a hard refresh may be useful once on an already-open lab page.


## Student-home/navigation update (2026-09-03)

After deployment, confirm the course home shows **Практика без лишней сложности** before the full syllabus, and confirm each lab has **← К курсу** in the fixed bottom navigation. Asset cache version is `20260903-9`; after first deployment, one hard refresh is useful when validating an already-open browser tab.


## LX7 cache/update note — 2026-09-08
LX7 and its static MCQ/report/progress assets use cache version `20260908-1`. After the first deployment of this release, a hard refresh is useful only when validating a browser tab that was already open before deployment.
