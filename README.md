# projen-cdk-hugo-pipeline

This is a [projen](https://github.com/projen/projen) project template to manage the [mavogel/cdk-hugo-pipeline](https://github.com/mavogel/cdk-hugo-pipeline) repository. Please see the [API](./API.md) for documentation.

Setup the boilerplate for a hugo blog with a CDK pipeline to deploy it to AWS :tada:

## Usage
Quickly run the generator :tada:

### General
which uses the [blist](https://github.com/apvarun/blist-hugo-theme) in `v2.1.0` by default:

```sh
# 1. create a new project directory
mkdir my-website &&  cd my-website

# 2. set up the project using the projen new command
npx projen new \
    --from @mavogel/projen-cdk-hugo-pipeline@~0 \
    --domain='example.com' \
    --projenrc-ts \
    --no-git

# 3. install dependencies for the theme (blist by default)
npm --prefix blog install

# 4. run the hugo development server
npm run dev

# 5. see if it builds correctly
npm run build-dev
npm run build # for production
```
Now open your browser and go to [http://localhost:1313](http://localhost:1313) to see the the website :tada:

See the [API.md](API.md) for more details and all possible configuration options.

### For the AWS UG theme
from [Kadir](https://github.com/kkeles) as a template for all AWS UGs. See here for the [repo](https://github.com/kkeles/awsug-hugo)

```sh
# 1. create a new project directory
mkdir awsug-your-town &&  cd awsug-your-town

# 2. set up the project using the projen new command
npx projen new \
    --from @mavogel/projen-cdk-hugo-pipeline@~0 \
    --domain='awsug-frankfurt.de' \
    --hugoThemeGitRepo='https://github.com/mvogel/awsug-hugo.git' \
    --hugoThemeGitRepoBranch='feat/example-site' \
    --hugoThemeSubmoduleStructure='themes/awsug' \
    --hugoThemeConfigFile='hugo.toml' \
    --projenrc-ts \
    --no-git

# 3. run the hugo development server
npm run dev

# 4. see if it builds correctly
npm run build-dev
npm run build-prod # for production
```

## Configuring the themes
You can have multiple themes, and use only one. Configure the `hugo.toml` or `config.toml` accordingly. See the setup andc configuring instructions [here](https://gohugo.io/getting-started/quick-start/).
### Adding
Add a theme by adding a `gitmodule`. See the stackoverflow [post](https://stackoverflow.com/questions/1777854/how-can-i-specify-a-branch-tag-when-adding-a-git-submodule) for details.
```sh
git submodule add https://github.com/apvarun/blist-hugo-theme.git blog/themes/blist
git submodule set-branch --branch v2.1.0 blog/themes/blist
```

### Updating
You can also update a theme by updating the `gitmodule` and setting the branch or tag.
```sh
git submodule update blog/themes/blist
# set to new tag or branch
git submodule set-branch --branch v2.1.0 blog/themes/blist
```
### Removing
Remove a theme by removing the `gitmodule` and the respective content `.git` folder.
```sh
export PATH_TO_THEME=blog/themes/blist
git submodule deinit -f $PATH_TO_THEME && rm -rf .git/modules/$PATH_TO_THEME && git rm -f $PATH_TO_THEME
```

## How to contribute to Projen CDK Hugo Pipeline

### **Did you find a bug?**

* **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/MV-Consulting/projen-cdk-hugo-pipeline/issues).

* If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/MV-Consulting/projen-cdk-hugo-pipeline/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

### **Did you write a patch that fixes a bug?**

* Open a new GitHub pull request with the patch.

* Ensure the PR description clearly describes the problem and solution. Include the relevant issue number if applicable.

### **Did you fix whitespace, format code, or make a purely cosmetic patch?**

Changes that are cosmetic in nature and do not add anything substantial to the stability, functionality, or testability will normally not be accepted. Please file an issue and we will add it together with the next feature or fix.

### **Do you intend to add a new feature or change an existing one?**

* Suggest your change under [Issues](https://github.com/MV-Consulting/projen-cdk-hugo-pipeline/issues).

* Do not open a pull request on GitHub until you have collected positive feedback about the change.

### **Do you want to contribute to the CDK Serverless documentation?**

* Just file a PR with your recommended changes

## Authors

Coded for you by [MV  Consulting](https://manuel-vogel.de)