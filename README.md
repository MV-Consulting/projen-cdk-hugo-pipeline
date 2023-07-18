# projen-cdk-hugo-pipeline

## Themes
You can have multiple themes, and use only one. Configure the `config.toml` accordingly.
### Adding
- see stackoverflow [post](https://stackoverflow.com/questions/1777854/how-can-i-specify-a-branch-tag-when-adding-a-git-submodule) for details.
```sh
git submodule add https://github.com/apvarun/blist-hugo-theme.git frontend/themes/blist
git submodule set-branch --branch v2.1.0 frontend/themes/blist
```

### Updating
```sh
git submodule update frontend/themes/blist
# set to new tag or branch
git submodule set-branch --branch v2.1.0 frontend/themes/blist
```
### Removal
```sh
export PATH_TO_THEME=frontend/themes/blist
git submodule deinit -f $PATH_TO_THEME && rm -rf .git/modules/$PATH_TO_THEME && git rm -f $PATH_TO_THEME
```