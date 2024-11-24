# from sst import Resource
from .shared import foo
from core.db import get_user
from core.ping import ping


def handler(event, context):
    print("Function invoked from Python")

    print(foo())

    res = ping()
    print(get_user("123"))
    print("Ping result:", res)

    return {
        "statusCode": 200,
        "body": "Hello, World!",
        # "body": f"{Resource.MyLinkableValue.foo} from Python!",
    }
