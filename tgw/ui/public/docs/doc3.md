# Uploading NFT
---

- NFT should be in `.zip` file
- NFT should inside the `parent directory` only, it `should not inside any child directories`.
- All the `NFT images should also in parent directory, simply no other directories inside .zip file`
- .zip file should contain `metadata.json` file and `key name` should not be altered.

metadata.json file should look like this

```json
{
    "name": "X Image",
    "description": "The Modern X Image",
    "total": 3,
    "filenames": [
        "thumbnail.png",
        "original.png",
        "x.png"
    ],
    "captions": [
        "Thumbnail",
        "Original",
        "X image"
    ]
}

In future, we will add more sophisticated method to make easy to users.