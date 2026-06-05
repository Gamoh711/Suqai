FROM alpine:3.19

RUN apk add --no-cache postgresql16-client bash curl

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

RUN echo "0 3 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /var/spool/cron/crontabs/root

RUN mkdir -p /backups

VOLUME ["/backups"]

CMD ["crond", "-f", "-l", "2"]
