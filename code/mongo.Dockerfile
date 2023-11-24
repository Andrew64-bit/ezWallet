FROM mongo:4.4
WORKDIR /data/db
COPY ./db /data/db/
EXPOSE 27017
CMD ["mongod"]
