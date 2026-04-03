# Node-RED Node Development Expert Rules

You are an expert in developing Node-RED nodes that can be integrated with Home Assistant.
You must always follow these instructions for this project.
Write all documentation and all code in English.

## Technical Stack
- Always use the latest version of Home Assistant and the latest Node-RED Add-on in Home Assistant.
- Use `luxon` for all date/time handling. Always store and compare times as ISO 8601 strings with timezone (e.g. `DateTime.now().toISO()`). Never use the native `Date` object directly.

## Documentation
- Documentation is created with VuePress version 2 and written in Markdown. It is located in the docs folder and provides full descriptions of the nodes.
- When modifying existing nodes, make sure to follow what is described in the documentation unless instructed to change something.
- In the node's HTML file, only include a simple description of each individual input field.
- When making changes to a node, remember to update the documentation in both places.

## Git
- Do not run git add or git commit. You may use git to compare versions and review changes, but do not create new pull requests or commits.

## Testing
- Build nodes so that their functionality can be tested as easily as possible with unit tests.
- Also write tests that test the node's functionality.
- Create test data as needed.
- Use Mocha with Chai (`expect`) and `node-red-node-test-helper` for integration tests.
- Use `sinon` stubs for mocking the node object and Home Assistant in unit tests.
- Place reusable test helpers in a `*-test-utils.js` file next to the test file.
- Place test data (JSON/JS) in the `test/data/` folder.

## Node input and output
- Nodes that have config in their HTML file should also be able to accept config as input and change it dynamically. See how this is documented in docs/nodes/dynamic-config.md and how it is implemented in other nodes.
- When instructed, commands can also be sent to nodes. This is documented in docs/nodes/dynamic-commands.md.
- When equivalent config and commands are used across multiple nodes, use the same names so they are recognizable.
- Strategy nodes must have three outputs: output 1 (current on/off state), output 2 (alternate state), output 3 (full schedule).
- All strategy nodes must support the `override` config field with values `"auto"`, `"on"`, or `"off"`.

## Code architecture
- Keep node `.js` files small (I/O wiring only). All business logic must go in a separate `-functions.js` file (e.g. `light-saver-functions.js`). This makes unit testing straightforward without loading the full Node-RED runtime.
- Use the shared utility functions from `utils.js` (e.g. `getEffectiveConfig`, `msgHasConfig`, `fixOutputValues`, `saveOriginalConfig`) rather than reimplementing them in each node.
- Every node must support configurable context storage. Use `node.contextStorage` and access context with `node.context().get(key, node.contextStorage)` / `node.context().set(key, value, node.contextStorage)`.

## Node status
Always use the following `node.status()` conventions:
- Idle / cleared: `node.status({})`
- Loading / waiting: `{ fill: "blue", shape: "dot", text: "..." }`
- Warning / no data: `{ fill: "yellow", shape: "dot", text: "..." }`
- Error: `{ fill: "red", shape: "ring", text: "..." }`
- OK / active: `{ fill: "green", shape: "dot", text: "..." }`

## Code style
- Prettier is configured with 120 character print width. Run it before finishing any change.
- ESLint is configured in `eslint.config.cjs`. Fix all lint errors before finishing any change.

## Edit dialog in the HTML file
- When config requires entities in Home Assistant, these should be fetched directly from Home Assistant as done in the ps-light-saver node.
- Use the same style in the HTML file and edit dialog as done in ps-light-saver.
- Avoid line breaks in labels.

