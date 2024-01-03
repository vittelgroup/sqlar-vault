/**
 * Generates an array of '25' mock text files.
 * Each file has a unique name and content.
 * @returns {Array<{ fileName: string, file: Blob }>} An array (size of 25) of mock text files.
 */
export function mockTextFiles() {
  const initialFileNames = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "x",
    "y",
    "z",
  ];
  return initialFileNames.map((initialFileName) => {
    const fileName = `${initialFileName}_hello.txt`;
    const fileContent = `${fileName}_Hello World!\nLoremIpsum\nNeque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...`;

    const originalFile = new Blob([fileContent], { type: "text/plain" });

    return {
      fileName,
      file: originalFile,
    };
  });
}
