package main

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/sst/sst/sdk/golang/sst"
)

func handler() (string, error) {
	return sst.Get("App", "name"), nil
}

func main() {
	lambda.Start(handler)
}
