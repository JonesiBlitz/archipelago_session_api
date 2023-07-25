import { ArchipelagoClient,
  CommandPacketType,
  ItemsHandlingFlags
} from 'archipelago.js';
import fs from 'fs';

type Version = {
  major: number;
  minor: number;
  build: number;
}

type Props = {
  url: string;
  game: string;
  playerName: string;
  uuid?: string;
  version?: Version;
  itemsHandling?: ItemsHandlingFlags;
}

// type Hint = {
//   player1: string;
//   player2: string;
//   location: string;
//   item: string;
// }

// const hints: Hint[] = [];

/**
 *
 * @param url
 * @param uuid
 * @param version
 * @param playerName
 * @param game
 * @param itemsHandling
 */
export const collectTheData = async ({url, uuid, version, playerName, game, itemsHandling}: Props): Promise<void> => {

  try {
    const client = new ArchipelagoClient( url );
    const credentials = {
      game,
      name: playerName,
      uuid: uuid ?? "",
      version: version ?? { major: 0, minor: 4, build: 1 },
      items_handling: itemsHandling ?? ItemsHandlingFlags.REMOTE_ALL,
    };

    console.log( `Connecting to room...` );
    console.log( `Credentials: ${JSON.stringify( credentials )}` );
    await client.connect( credentials );

    console.log( `Connected to room with ${client.data.players.size} players.` );



    // fs.writeFile("data.json", client.data.package, err => {
    //   if(err) throw err;
    //   console.log("Data written to file");
    // });
    const playerMap = client.data.players;
    // map of player id to obj
    // {
    //  team: 0,
    //  slot: 1,
    //  name: 'BlueTrainBlitz',
    //  alias: 'BlueTrainBlitz',
    //  class: 'NetworkPlayer',
    // }
    const itemMap = client.data.items; // map of item id to item name string
    const locationMap = client.data.locations; // map of location id to location name string

    client.send({ cmd: CommandPacketType.SAY, text: "!hint" });
    // client.send({ cmd: CommandPacketType.SAY, text: "!players" });
    // client.send({ cmd: CommandPacketType.SAY, text: "!options" });
    client.addListener("printJSON", (_, message) => messageParser(message, playerMap, itemMap, locationMap));



    // const clients = spawnChaos(playerMap, playerName, credentials, url);

    // for(const tempClient of clients){
    //   console.log(tempClient.credentials);
    //   await tempClient.client.connect(tempClient.credentials);
    //   tempClient.client.send({ cmd: CommandPacketType.SAY, text: "!hint" });
    //   tempClient.client.addListener("printJSON", (_, message) => messageParser(message, playerMap, itemMap, locationMap));
    // }
    //
    // setTimeout(function(){
    //   for(const tempClient of clients){
    //     tempClient.client.removeListener("printJSON", (_, message) => messageParser(message, playerMap, itemMap, locationMap));
    //     tempClient.client.disconnect();
    //   }
    //   client.removeListener("printJSON", (_, message) => messageParser(message, playerMap, itemMap, locationMap));
    //   client.disconnect();
    // }, 2000);




  } catch ( error ) {
    console.error(JSON.stringify(error));
    throw error;
  }
}

// type Hint = {
//   player1: string;
//   item: string;
//   location: string;
//   player2: string;
// }

// type Crazy = {
//   client : ArchipelagoClient;
//   playerId: number;
//   playerName: string;
//   credentials: SlotCredentials;
// }

// const spawnChaos = (playerMap, currentPlayer: string, credentials: SlotCredentials, url): Crazy[] => {
//   const clients: Crazy[] = [];
//   for(const [playerId, player] of playerMap) {
//     if (player.name !== currentPlayer) {
//       console.log(`Spawning chaos for ${player.name}`);
//       const newCredentials = {
//         ...credentials,
//         name: player.name,
//       };
//       clients.push({
//         client: getClient(url),
//         playerId,
//         playerName: player.name,
//         credentials: newCredentials,
//       });
//     }
//   }
//   return clients;
// }

// const getClient = (url): ArchipelagoClient => {
//   return new ArchipelagoClient( url );
// }

const messageParser = (message: string, playerMap, itemMap, locationMap): boolean => {
  if (message.startsWith("[Hint]: ")) {
    hintParser(message, playerMap, itemMap, locationMap);
  } else {
    console.log(message);
  }
  return true;
}

const hintParser = (message: string, playerMap, itemMap, locationMap): void => {
  const messageArray = message.split(" ");

  const player1Slot = parseInt(messageArray?.[1]?.split("'")[0]);
  const itemId = parseInt(messageArray?.[2]);
  const locationId = parseInt(messageArray?.[5]);
  const player2Slot = parseInt(messageArray?.[7]?.split("'")[0]);

  const player1 = playerMap.get(player1Slot)?.name;
  const item = itemMap.get(itemId);
  const location = locationMap.get(locationId);
  const player2 = playerMap.get(player2Slot)?.name;

  // console.log(`${player1}'s ${item} is at ${location} in ${player2}'s World.`);
  const line = `${player1}'s ${item} is at ${location} in ${player2}'s World.\n`;
  const newLine = `${player2} - ${location} - ${item} for ${player1}\n`
  // hints.push({
  //   player1,
  //   item,
  //   location,
  //   player2,
  // });
  if(messageArray?.[9] === '(found)'){
    console.log(`${player1}'s ${item} is at ${location} in ${player2}'s World.(found) not saving to write`);
  }
  if(messageArray?.[9] !== '(found)'){
    fs.appendFile("newhints.json", newLine, function(err) {
      if(err) {
        return console.log(err);
      }
      console.log(`${player1}'s ${item} is at ${location} in ${player2}'s World.`);
    });
  }
}
