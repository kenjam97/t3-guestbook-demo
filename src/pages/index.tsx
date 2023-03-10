import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"
import { api } from '../utils/api'


  const Form = () => {
    const { data: session }  = useSession()
    const utils = api.useContext();
    const [message, setMessage] = useState("")

    const postMessage = api.guestbook.postMessage.useMutation({
      onMutate: async () => {
        await utils.guestbook.getAll.cancel()
        const optimisticUpdate = utils.guestbook.getAll.getData()

        if (optimisticUpdate) {
          utils.guestbook.getAll.setData(undefined, optimisticUpdate)
        }
      },
      onSettled: async () => {
        await utils.guestbook.getAll.invalidate()
      }
    })

    return (
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          postMessage.mutate({
            name: session?.user?.name as string,
            message
          })
          setMessage("")
        }}
      >
        <input
          type="text"
          value={message}
          placeholder="Your message..."
          minLength={2}
          maxLength={100}
          onChange={(event) => setMessage(event.target.value)}
          className="px-4 py-2 rounded-md border-2 border-zinc-800 bg-neutral-900 focus:outline-none"
        />
        <button
          type="submit"
          className="p-2 rounded-md border-2 border-zinc-800 focus:outline-none"
        >
          Submit
        </button>
      </form>
    )
  }
const Messages = () => {
  const { data: messages, isLoading } = api.guestbook.getAll.useQuery()

  if (isLoading) {
    return <div>Fetching messages...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {messages?.map((msg, index) => 
        <div key={index}>
          <p>{msg.message}</p>
          <span>- {msg.name}</span>
        </div>
      )}
    </div>
  )
}

const Home = () => {
  const {data: session, status} = useSession()

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>
  }

  return (
    <main className="flex flex-col items-center">
      <h1 className="text-3xl pt-4">Guestbook</h1>
      <div className="pt-10">
        <div>
          {session ? (
            <>
              <p>Hi {session.user?.name}</p>
              <button onClick={() => void signOut()}>Logout</button>
              <div className="pt-6">
                <Form />
              </div>
            </>
          ) : (
            <button onClick={() => void signIn("discord")}>
              Login with Discord
            </button>
          )}
          <div className="pt-10">
            <Messages />
          </div>
        </div>
      </div>
    </main>
  )
}

export default Home
