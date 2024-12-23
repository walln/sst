FROM golang as builder
WORKDIR /app
COPY . .
RUN go build -o main

FROM scratch
COPY --from=builder /app/main /main
ENTRYPOINT ["/main"]
