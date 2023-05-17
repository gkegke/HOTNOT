export function randomChoice(items, numToChoose, _) {
  // Initialize an array to store the chosen items

  if (items.length < numToChoose) {
    return items;
  }

  const chosenItems = [];

  // Fill the reservoir with the first numToChoose items
  for (let i = 0; i < numToChoose; i++) {
    chosenItems[i] = items[i];
  }

  // Replace items in the reservoir with gradually decreasing probability
  for (let i = numToChoose; i < items.length; i++) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    if (randomIndex < numToChoose) {
      chosenItems[randomIndex] = items[i];
    }
  }

  // Return the chosen items array
  return chosenItems;
}

export function nextN(items, numToChoose, index) {
  if (items.length < numToChoose) {
    return items;
  }

  // create an empty array to store the result
  let result = [];
  // loop numToChoose times
  for (let i = 0; i < numToChoose; i++) {
    // increment the index by one, wrapping around if necessary
    index = (index + 1) % items.length;
    // push the item at the current index to the result array
    result.push(items[index]);
  }
  // return the result array
  return result;
}
