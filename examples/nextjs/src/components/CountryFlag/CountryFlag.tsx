import countryMap from './utils/countryMaps'


type Props = {
  countryName: string
}

export function CountryFlag({countryName}: Props) {
  const flag = countryMap[countryName.toLowerCase() as keyof typeof countryMap]

  if (!flag) {
    return null
  }

  return (
    <img className="w-5 h-3.5" src={`https://flagicons.lipis.dev/flags/4x3/${flag}.svg`} alt="" />
  )
}
