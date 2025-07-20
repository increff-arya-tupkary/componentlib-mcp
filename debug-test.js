// Debug the exact strings in the failing tests

const input1 = `
				# Button Component

				## Installation

				## Usage
				Use the button component like this.
			`.trim();

const expected1 = `
				# Button Component

				## Usage
				Use the button component like this.
			`.trim();

console.log("=== removeInstallationHeader test ===");
console.log("Input:");
console.log(JSON.stringify(input1));
console.log("\nExpected:");
console.log(JSON.stringify(expected1));

// Check what should be removed
const linesToRemove = input1
	.split("\n")
	.filter((line) => !expected1.split("\n").includes(line));
console.log("\nLines that should be removed:");
console.log(linesToRemove.map((line) => JSON.stringify(line)));

const input2 = `
				# Component
				<Spacer />
				Some content here.
			`.trim();

const expected2 = `
				# Component

				Some content here.
			`.trim();

console.log("\n\n=== removeSpacerComponents test ===");
console.log("Input:");
console.log(JSON.stringify(input2));
console.log("\nExpected:");
console.log(JSON.stringify(expected2));

// Let's see the difference
const inputLines = input2.split("\n");
const expectedLines = expected2.split("\n");
console.log("\nInput lines:");
inputLines.forEach((line, i) => console.log(`${i}: ${JSON.stringify(line)}`));
console.log("\nExpected lines:");
expectedLines.forEach((line, i) =>
	console.log(`${i}: ${JSON.stringify(line)}`),
);
