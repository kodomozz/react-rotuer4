import pathToRegexp from "path-to-regexp";

const patternCache = {};
const cacheLimit = 10000;
let cacheCount = 0;

const compilePath = (pattern, options) => {
  //  设置缓存 3*2 6种情况，超出10000个限制则不进行缓存
  // patternCache= {
  //   'truefalsetrue': {},
  //   'truefalsefalse': {},
  //   'truetruefalse': {}
  // }
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {});

  if (cache[pattern]) return cache[pattern];

  const keys = [];
  const re = pathToRegexp(pattern, keys, options);
  const compiledPattern = { re, keys };
  //  此处用到了 路劲转正则对象的库 path-to-regexp 具体参见 npm: https://npm.taobao.org/package/path-to-regexp
  // example:
  // const keys = []
  // const re = pathToRegexp('/home/:foo/:bar', keys)
  //  re  ==> /^\/home\/((?:[^\/]+?))\/((?:[^\/]+?))(?:\/(?=$))?$/i
  //  keys ==> 
              // [
              //   {name: "foo", prefix: "/", delimiter: "/", optional: false, repeat: false, …}
              //   {name: "bar", prefix: "/", delimiter: "/", optional: false, repeat: false, …}
              // ]

  // re.exec('/home/params-foo/params-bar')              
  // [
  //   "/home/params-foo/params-bar",
  //   "params-foo",
  //   "params-bar",
  //   index: 0,
  //   input: "/home/params-foo/params-bar",
  //   groups: undefined
  // ]

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledPattern;
    cacheCount++;
  }

  return compiledPattern;
};

/**
 * Public API for matching a URL pathname to a path pattern.
 */
const matchPath = (pathname, options = {}, parent) => {
  // path 必须参数
  if (typeof options === "string") options = { path: options };

  const { path, exact = false, strict = false, sensitive = false } = options;

  if (path == null) return parent;
  //  返回值:
  //  re 路径相匹配的正则
  //  keys 路由中带上的参数         
  const { re, keys } = compilePath(path, { end: exact, strict, sensitive });
  // 根据返回的正则 通过exec 正则方法匹配路径 ， 如果匹配到返回一个 数组，没有返回null
  const match = re.exec(pathname); 

  if (!match) return null;
  // 解构， 取匹配到的路径
  const [url, ...values] = match;
  // 是否完全匹配
  const isExact = pathname === url;
  // 如果在route 上要求是 excat 完全匹配， 但是实际上不是的话， 返回 直接pass不通过， 
  // 也就是验证了 如果没有配上match返回的是null
  if (exact && !isExact) return null;
  // 匹配成功 返回match 中的四个参数， path, url, isExact, params(路径上的参数)
  return {
    path, // the path pattern used to match
    url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
    isExact, // whether or not we matched exactly
    params: keys.reduce((memo, key, index) => {  // keys 中的name就是路径中的参数
      memo[key.name] = values[index];
      return memo;
    }, {})
  };
};

export default matchPath;

