import CustomError from '@/importor/error';
import uuid from '@/importor/utils/uuid';
import createSandbox from '@/importor/sandBox';

/*
 * @Author: caiwu
 * @Date: 2021-04-10 22:49:03
 * @Last Modified by: caiwu
 * @Last Modified time: 2021-06-27 19:50:08
 */
class SyncHook {
  constructor(args) {
    this.args = args;
    this.tasks = {};
  }
  tap(hookName, task) {
    if (!this.tasks[hookName]) {
      this.tasks[hookName] = task;
    } else {
      throw CustomError(
        'SyncHookTapError',
        `A SyncHook named ${hookName} already exists, But you can run Instance.remove(hookName) before defining it `
      );
    }
  }
  call(hookName, ...args) {
    if (!this.tasks[hookName]) {
      throw new CustomError('SyncHookCallError', `The SyncHook named ${hookName} not exists;`);
    }
    if (this.args) {
      if (args.length < this.args.length) {
        throw new CustomError('SyncHookCallError', `${this.args.length} arguments required;but ${args.length} provided`);
      }
      args = args.slice(0, this.args.length);
    }
    this.tasks[hookName](...args);
  }
  remove(hookName) {
    if (!this.tasks[hookName]) {
      throw new CustomError('SyncHookCallError', `The SyncHook named ${hookName} not exists;`);
    }
    this.tasks[hookName] = null;
  }
}

/*
 * @Author: caiwu
 * @Date: 2021-04-10 22:48:13
 * @Last Modified by: caiwu
 * @Last Modified time: 2021-08-29 23:58:39
 */
function htmlLoader(entry, option) {
  let defaultOpt = {
    origin: window.location.origin,
    cssScope: false,
    proxy: false,
    activeRoute: '',
    prefix: '',
    pathRewrite: {
      '': '',
    },
  };
  defaultOpt = Object.assign(defaultOpt, option);
  let entryUrl = defaultOpt.proxy ? entry : defaultOpt.origin;
  return fetch(entryUrl)
    .then((res) => res.text())
    .then((data) => {
      let parser = new DOMParser();
      let dom = parser.parseFromString(data, 'text/html');
      console.log(dom.head.children);
      return domAnalysis(entry, dom, defaultOpt)
    })
}
// dom analysis
function domAnalysis(entry, dom, defaultOpt) {
  let result = { scripts: [], styles: [], template: null, preLoads: [] };
  scriptPicker(entry, dom, result, defaultOpt);
  stylePicker(entry, dom, result, defaultOpt);
  templatePicker(dom, result);
  return result
}
// pcik scripts from htmlEntry
function scriptPicker(entry, dom, result, defaultOpt) {
  let scripts = dom.querySelectorAll('script');
  let origin = window.location.origin.replace(/\//g, '\\/');
  let reg = new RegExp(`(${origin})*(.*)`);
  result.scripts = Array.from(scripts).map((ele) => {
    ele.remove();
    let src = ele.src.replace(reg, '$2');
    return {
      src: markPath(src, entry, defaultOpt),
      defer: ele.defer,
      async: ele.async,
      innerHTML: ele.innerHTML,
    }
  });
}
// pcik styles from htmlEntry
function stylePicker(entry, dom, result, defaultOpt) {
  let styles = Array.from(dom.head.children).filter((ele) => ['LINK', 'STYLE'].includes(ele.tagName));
  let origin = window.location.origin.replace(/\//g, '\\/');
  let reg = new RegExp(`(${origin})*(.*)`);
  styles.map((ele) => {
    if (ele.tagName === 'LINK') {
      let href = ele.href.replace(reg, '$2');
      if (ele.rel === 'stylesheet') {
        result.styles.push({
          href: markPath(href, entry, defaultOpt),
          rel: ele.rel,
        });
      } else {
        result.preLoads.push({
          href: markPath(href, entry, defaultOpt),
          rel: ele.rel,
          as: ele.as,
          sizes: ele.sizes.value,
        });
      }
    } else {
      result.styles.push(ele.innerHTML);
    }
    ele.remove();
  });
}
// pcik template from htmlEntry
function templatePicker(dom, result) {
  let childNodes = Array.from(dom.body.childNodes);
  result.template = childNodes;
}

function markPath(src, entry, defaultOpt) {
  if (src) {
    if (/^http(s){0,1}/.test(src)) {
      return src
    } else {
      const prefix = defaultOpt.prefix === undefined || defaultOpt.prefix === null ? entry : defaultOpt.prefix;
      const replaceKey = Object.keys(defaultOpt.pathRewrite)[0] || '',
        replaceValue = Object.values(defaultOpt.pathRewrite)[0] || '';
      return defaultOpt.proxy ? prefix + src : defaultOpt.origin + src.replace(replaceKey, replaceValue)
    }
  } else {
    return null
  }
}

/*
 * @Description:
 * @Author: caiwu
 * @CreateDate:
 * @LastEditor:
 * @LastEditTime: 2021-07-16 17:10:43
 */
async function resourceParser(resources, entry, option, el, ctx) {
  let preLoads, styles, scripts;
  const preLoadScript = resources.preLoads.filter((ele) => /.*\.js$/.test(ele.href));
  preLoads = dealPreloads(resources.preLoads);
  styles = await dealStyles(resources.styles, option, el);
  scripts = await dealScripts([...preLoadScript, ...resources.scripts]);
  return { preLoads, styles, template: resources.template, scripts };
}
function dealScripts(scripts) {
  let promiseList = [];
  scripts.forEach((ele) => {
    promiseList.push(
      ele.innerHTML
        ? ele.innerHTML
        : fetch(ele.src || ele.href)
            .then((res) => res.text())
            .then((data) => data)
            .catch((error) => {
              throw new Error('dealScripts error:', error);
            })
    );
  });

  return Promise.all(promiseList).then((res) => {
    let code;
    code = res.join(';\n');
    return code;
  });
}
function dealStyles(styles, option, el) {
  let styleList = [];
  if (!option.cssScope) {
    styles.forEach((ele) => {
      let style;
      if (typeof ele === 'string') {
        style = document.createElement('style');
        style.innerHTML = ele;
      } else {
        style = document.createElement('link');
        style = Object.assign(style, ele);
      }
    });
    return styleList;
  } else {
    let promiseList = [];
    styles.forEach((ele) => {
      promiseList.push(
        typeof ele === 'string'
          ? ele
          : fetch(ele.href)
              .then((res) => res.text())
              .then((data) => data)
              .catch((error) => {
                throw new Error('dealStyles error:', error);
              })
      );
    });

    return Promise.all(promiseList).then((res) => {
      let innerHTML, className, style;
      className = typeof option.cssScope === 'string' ? option.cssScope : 'u' + uuid();
      el.classList.add(className);
      innerHTML = res.join('');
      style = document.createElement('style');
      const reg = /(\s*)([\.|#]?.*?)(\s*{\s*[^\}]*?\s*\})/g;
      innerHTML = innerHTML.replace(reg, (match, $1, $2, $3) => {
        if ($2 === 'body') $2 = '';
        return `${$1} .${className} ${$2} ${$3}`;
      });
      style.innerHTML = innerHTML;
      return [style];
    });
  }
}
function dealPreloads(preLoads) {
  let fragment = document.createDocumentFragment();
  let links = [];
  preLoads.forEach((ele) => {
    let link = document.createElement('link');
    link = Object.assign(link, ele);
    ele.__mounted__ = true;
    links.push(link);
    fragment.appendChild(link);
  });
  document.head.appendChild(fragment);
  return links;
}

/*
 * @Description:
 * @Author: caiwu
 * @CreateDate:
 * @LastEditor:
 * @LastEditTime: 2021-08-26 17:12:52
 */
function registerApp(app, entry, option) {
  const activeRoute = option.activeRoute ? option.activeRoute : entry;
  const prevRoute = window.location.hash.slice(1);
  if (prevRoute !== activeRoute) {
    app.$router.push(activeRoute);
  }
}

/*
 * @Author: caiwu
 * @Date: 2021-04-10 22:47:07
 * @Last Modified by: caiwu
 * @Last Modified time: 2021-08-27 01:17:56
 */
function initLifecycle(vueOptions, entry, option, hook) {
  let { created, mounted, destroyed } = vueOptions;
  vueOptions.beforeCreate.push(function() {
    this.$nextTick(() => {
      hook.call('bootstrap', entry, option, this.$el, this);
    });
    hook.call('beforeCreateCb', this, entry);
  });
  vueOptions.created = async function() {
    created && created.call(this);
    hook.call('createdCb', this, entry);
  };
  vueOptions.mounted = function() {
    mounted && mounted.call(this);
    hook.call('mountedCb', this, entry);
  };
  vueOptions.destroyed = function() {
    destroyed && destroyed.call(this);
    hook.call('unmountedCb', this, entry);
  };
}

/*
 * @Description: 
 * @Author: caiwu
 * @CreateDate: 
 * @LastEditor: 
 * @LastEditTime: 2021-07-27 14:19:15
 */
var defaultConfig = {
    registerApp,
    initLifecycle
};

function exec(parseredResources, el, app, entry, option, hook) {
  console.log(parseredResources);
  let fragment = document.createDocumentFragment(),
    templateFragment = document.createDocumentFragment();
  parseredResources.template.forEach((childNode) => {
    templateFragment.appendChild(childNode);
  });
  el.appendChild(templateFragment);
  parseredResources.styles
    .filter((ele) => !ele.__mounted__)
    .forEach((style) => {
      style.__mounted__ = true;
      fragment.appendChild(style);
    });
  parseredResources.preLoads
    .filter((ele) => !ele.__mounted__)
    .forEach((preLoad) => {
      preLoad.__mounted__ = true;
      fragment.appendChild(preLoad);
    });
  document.head.appendChild(fragment);
  createSandbox(parseredResources.scripts, window, app, entry, option, hook);
}

function markHeader() {
  document.head.children.forEach((ele) => {
    ele.isMain = true;
  });
}
function clearExtra() {
[...document.head.children]
    .filter((ele) => !ele.isMain)
    .forEach((i) => {
      if (!i.isMain) {
        console.log(i);
        i.remove();
      }
    });
}

/*
 * @Author: caiwu
 * @Date: 2021-04-10 22:45:01
 * @Last Modified by: caiwu
 * @Last Modified time: 2021-08-27 23:24:46
 */

class ComponentImport {
  syncHook = new SyncHook();
  initLifecycle = null;
  mountedCb = null;
  unmountedCb = null;
  beforeCreateCb = null;
  createdCb = null;
  sourcesCache = {};
  constructor(config = {}) {
    let conf = Object.assign(defaultConfig, config);
    this.init(conf);
  }
  init(conf) {
    // 注入生命周期
    this.initLifecycle = conf.initLifecycle;
    this.syncHook.tap('registerApp', conf.registerApp);
    this.syncHook.tap('bootstrap', async (entry, option, el, app) => {
      let parseredResources = this.sourcesCache[entry];
      if (parseredResources) {
        exec(parseredResources, el, app, entry, option, this.syncHook);
      } else {
        let resources = await htmlLoader(entry, option);
        console.log(resources);
        markHeader();
        resourceParser(resources, entry, option, el).then((parseredResources) => {
          exec(parseredResources, el, app, entry, option, this.syncHook);
          this.sourcesCache[entry] = parseredResources;
        });
      }
    });
    this.syncHook.tap('beforeCreateCb', (app, entry) => {
      this.beforeCreateCb && this.beforeCreateCb(app, entry);
    });
    this.syncHook.tap('createdCb', (app, entry) => {
      this.createdCb && this.createdCb(app, entry);
    });
    this.syncHook.tap('mountedCb', (app, entry) => {
      this.mountedCb && this.mountedCb(app, entry);
    });
    this.syncHook.tap('unmountedCb', (app, entry) => {
      this.rollBcak(entry);
      this.unmountedCb && this.unmountedCb(app, entry);
    });
    // 微应用创建之前
    this.syncHook.tap('beforeCreate', (fn) => {
      this.beforeCreateCb = fn;
    });
    // 微应用创建但未挂载
    this.syncHook.tap('created', (fn) => {
      this.createdCb = fn;
    });
    // 微应用已经挂载
    this.syncHook.tap('mounted', (fn) => {
      this.mountedCb = fn;
    });
    // 微应用卸载
    this.syncHook.tap('unmounted', (fn) => {
      this.unmountedCb = fn;
    });
  }
  rollBcak(entry) {
    let parseredResources = this.sourcesCache[entry] || {};
    (parseredResources.styles || [])
      .filter((ele) => ele.__mounted__)
      .forEach((style) => {
        style.__mounted__ = false;
        style.remove();
      });
    (parseredResources.preLoads || [])
      .filter((ele) => ele.__mounted__)
      .forEach((preLoad) => {
        preLoad.__mounted__ = false;
        preLoad.remove();
      });
    clearExtra();
  }
  on(targetName, ...args) {
    this.syncHook.call(targetName, ...args);
    return this;
  }
  Import = function(component, entry, option) {
    // Return import without side effects if no entry is passed in
    if (!entry) {
      return component;
    }
    if (component instanceof Promise) {
      return component.then((data) => {
        this.initLifecycle(data.default || data, entry, option, this.syncHook);
        return data;
      });
    } else {
      this.initLifecycle(component, entry, option, this.syncHook);
      return component;
    }
  }.bind(this);
}

export { ComponentImport as default };
