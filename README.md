# UP Packages

Тулза для апа пакетов под задачи. Выполняет следующее:
* Принимает список задач и пакеты которые нужно апнуть к этим задачам.
* Сверяет версии, если версии разные, то берет максимальную.
* Устаналивает пакеты, коммитит изменения, пушит в gitlab.
* Создает мр в котором сразу выставляет апрувером тестировщика.


Также можно запускать повторно, чтоб апнуть пакеты еще раз, если появились изменения.

## Установка

```bash
npm ci
```

## Использование

Создать .env файл с содержимым:
```bash
GITLAB_TOKEN=TOKEN(взять можно из профиля в гитлабе)
```

Скопировать `config.example.yaml` в `config.yaml`.
Поменять в `config.yaml` в объекте `tasks` содержимое на нужное. Поменять в объекте `config`, путь до assr.

Узнать id вашего тестировщика можно, если зайти в его профиль в гитлабе и в ссылке на аватар будет id пользователя.

Запустить `npm start`. Ждать результатов.
