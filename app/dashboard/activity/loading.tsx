import { Spinner } from "@/components/ui/spinner"
import { Suspense } from "react"

const Loading: React.FC = () => {
    return <Suspense fallback={<Spinner />} />
}

export default Loading