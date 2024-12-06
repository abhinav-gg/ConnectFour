import ErrorPage from './error'

export default function ServerError() {
  return (
    <ErrorPage 
      code={500}
      message="Internal Server Error"
    />
  )
}