import axios from 'axios'

import config from '../config'


type IpfsData = {
  gameId: number
  sportTypeId: number
  entity1Name: string
  entity1Image: string
  entity2Name: string
  entity2Image: string
  titleCountry: string
  titleLeague: string
}

export type FormattedIpfsData = {
  league: string
  country: string
  participants: {
    name: string
    image: string
  }[]
}

const fetchGameIpfsData = async (ipfsHash: string): Promise<FormattedIpfsData | null> => {
  try {
    // TODO IPFS response with 5xx sometimes, need to add retry - added on 6/21/21 by pavelivanov
    const { data } = await axios.get(`${config.ipfsGateway}${ipfsHash}`, {
      timeout: 1500,
    })

    const { entity1Name, entity1Image, entity2Name, entity2Image, titleCountry, titleLeague } = data as IpfsData

    return {
      country: titleCountry,
      league: titleLeague,
      participants: [
        { name: entity1Name, image: entity1Image },
        { name: entity2Name, image: entity2Image },
      ],
    }
  }
  catch (err) {
    console.error(err)
    return null
  }
}

export default fetchGameIpfsData
