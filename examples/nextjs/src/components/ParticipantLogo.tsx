type Props = {
  image?: string | null
  name: string
}

export function ParticipantLogo(props: Props) {
  const { image, name } = props

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-20 h-20 bg-white rounded-full">
        <img className="w-12 h-12" src={image || undefined} alt="" />
      </div>
      <span className="max-w-[210px] mt-3 text-lg text-center">{name}</span>
    </div>
  )
}
