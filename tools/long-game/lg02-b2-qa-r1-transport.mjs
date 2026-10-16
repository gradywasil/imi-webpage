// Relocate the immutable r3 fixture's hardcoded historical origin only.
import {pathToFileURL} from 'node:url';
const {default:p}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const launch=p.launch.bind(p);
p.launch=async(...args)=>{
  const browser=await launch(...args),create=browser.createBrowserContext.bind(browser);
  browser.createBrowserContext=async(...options)=>{
    const context=await create(...options),newPage=context.newPage.bind(context);
    context.newPage=async(...options)=>{
      const page=await newPage(...options),goto=page.goto.bind(page);
      page.goto=(url,...options)=>goto(url.replace(/^http:\/\/127\.0\.0\.1:8313\//,'http://127.0.0.1:8314/'),...options);
      return page;
    };return context;
  };return browser;
};
