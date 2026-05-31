
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const files = [
  'js/data/foods.js',
  'js/data/food-taste-db.js',
  'js/data/food-taste.js',
  'js/data/food-personality.js',
  'js/modules/dress/config.js',
  'js/modules/dress/state.js',
  'js/data/yummy-code.js'
];
const sandbox = { window: {}, console, Buffer, TextEncoder, TextDecoder, dispatchEvent(){}, CustomEvent: function(){}, localStorage: { getItem(){return null;}, setItem(){}, removeItem(){} } };
sandbox.window = sandbox;
for (const file of files) {
  vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), file), 'utf8'), sandbox, { filename: file });
}
const stateApi = sandbox.Yummi.modules.dress.state;
const yummy = sandbox.Yummi.yummyCode;
const payload = {
  petName: '??',
  foods: ['??', '????', '????'],
  dress: { selected: { '??': '????', '??': '', '??': '??', '??': '', '??': '????', '??': '????' } }
};
const encoded = yummy.encodeShare(payload);
const decoded = yummy.decodeShare(encoded.code);
const analysis = yummy.analyzeSharedTaste(['??', '????'], decoded.payload);
console.log(JSON.stringify({
  headIndex: stateApi.getShareIndexForSelection('??', '????'),
  headFromIndex: stateApi.getSelectionForShareIndex('??', 1),
  fromShareFoods: stateApi.getFoodsFromShareSelection(payload.dress.selected),
  encodedOk: encoded.ok,
  decodedOk: decoded.ok,
  petName: decoded.payload.petName,
  foods: decoded.payload.foods,
  selected: decoded.payload.dress.selected,
  similarity: analysis.similarity,
  commonFoods: analysis.commonFoods,
  possibleFoods: analysis.possibleFoods,
  previewDrink: analysis.preview && analysis.preview.drink ? analysis.preview.drink.name : '',
  previewLayers: analysis.preview && analysis.preview.layers ? analysis.preview.layers.length : 0
}, null, 2));
