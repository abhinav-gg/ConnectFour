from litestar import Litestar, get


@get("/api/hello")
async def index() -> str:
  return "Hello, world!"


@get("/api/books/{book_id:int}")
async def get_book(book_id: int) -> dict[str, int]:
  return {"book_id": book_id}


app = Litestar([index, get_book])

# http://localhost:3000/api/books/1
# {"book_id": 1}

# http://localhost:3000/api/hello
# Hello, world!