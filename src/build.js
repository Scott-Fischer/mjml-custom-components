import { promises as fs } from 'fs';
import { readdirSync, statSync } from 'fs';
import path from 'path'
import mjml2html from 'mjml'
import { registerComponent } from 'mjml-core'
import babel from "@babel/core";


//return array of files in dir
const walkSync = (dir, filelist = []) => {
  readdirSync(dir).forEach(file => {
    filelist = statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file))
  })
  return filelist
}

const rawComponents = walkSync('src/components');
const rawEmails = walkSync('src/templates');


//transpile with babel and register in mjml
const registerComponents = async () => {
  rawComponents.forEach(async (component) => {
    const fileName = path.basename(component);
    console.log(fileName);
    const content =  await fs.readFile(path.normalize(component), 'utf8');
    const transpiled = await babel.transformAsync(content, {presets: ["@babel/preset-env"]});
    console.log(content)
    registerComponent(content);
    fs.writeFile(`build/components/${fileName}`, transpiled.code, () => {});
    });

    return;
};

// turn raw mjml into email-ready HTML
const transpileEmails = () => {
  rawEmails.forEach(async (email) => {
    const content = await fs.readFile(path.normalize(email), 'utf8');
    const result = mjml2html(content);
    const done = await fs.writeFile('build/emails/email.html', result.html);
    return done;
  });
};


const build = async () => {
  const ready = await registerComponents();
  transpileEmails(ready);
};

build();


//         const fullPath = path.join(process.cwd(), compPath.replace(/^components/, 'lib'))
//         delete require.cache[fullPath]
//         registerComponent(require(fullPath).default)
