Written in straight Node 5.x ES6. Unlike the JS3 tree of Hotspot, this does not
use Babel or any other transpilation, so many of those fancy ES6/ES7 features
(module import/export, object spread operators, async/await keywords, etc.) do
not exist. Sorry.

Install dependencies with `npm i`, then run the tool with `node .`. We'll
NPM-ify this eventually, maybe.

Development
-----------
I definitely recommend [node-inspector](https://github.com/node-inspector/node-inspector). Thank me later.

```sh
npm install -g node-inspector
node-debug .
```

