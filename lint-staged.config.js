// Formats staged files with Prettier in batches. One command with every staged path can
// exceed the Windows command-line limit (~8 KB through the npx/cmd shim) on large commits.
const BATCH_SIZE = 40;

const quote = (file) => `"${file}"`;

export default {
  '*': (files) => {
    const commands = [];
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      commands.push(
        `prettier --write --ignore-unknown ${files
          .slice(i, i + BATCH_SIZE)
          .map(quote)
          .join(' ')}`,
      );
    }
    return commands;
  },
};
