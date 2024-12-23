
FROM golang as builder
WORKDIR /app
COPY . .
RUN go build -o main

FROM scratch
LABEL org.opencontainers.image.source https://github.com/sst/sst
COPY --from=builder /app/main /main
ENTRYPOINT ["/main"]
