import pathToRegexp from "path-to-regexp";

const patternCache = {};
const cacheLimit = 10000;
let cacheCount = 0;

const compileGenerator = pattern => {
  const cacheKey = pattern;
  const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {});

  if (cache[pattern]) return cache[pattern];

  // pathToRegexp.compile(path)
  // var toPath = pathToRegexp_compile(/foo/:baz/icon-(\\d+).png/)
  //该函数接收一个对象，以对象的形式传值给路径参数，返回请求路径。
  // toPath({baz:'bazzz',0:1123'>)//=> /foo/bazzz/Icon-123.png
  const compiledGenerator = pathToRegexp.compile(pattern);
  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledGenerator;
    cacheCount++;
  }

  return compiledGenerator;
};

/**
 * Public API for generating a URL pathname from a pattern and parameters.
 */
const generatePath = (pattern = "/", params = {}) => {
  if (pattern === "/") {
    return pattern;
  }
  const generator = compileGenerator(pattern);
  // 传入路径参数 返回路径
  return generator(params, { pretty: true });
};

export default generatePath;
