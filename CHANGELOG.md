# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [STVP](https://mia.kiwi/projects/stvp).

## [25.0.6] - 2025-08-21

### Added

- Basic fragment-based "routing"
- `Post` class to get and display posts
- Basic tag-based filtering
- Pinned posts using the "pinned" metadata attribute
- Post links using the "links" metadata attribute
- Active tag preview when filtering posts by tag. You can close the tag to cancel the filtering
- Post search by author (click on the author name on the post preview card)
- Post search by path
- Endpoint to get random post
- Endpoint to list all tags
- Posts pagination
- README file
- Post images open in new window when clicked
- Post tags overflow shown when hovered or focused
- Disclaimer when trying to open a post with the 'NSFW' tag
- Preview cards with the tag 'NSFW' are blurred
- Post source (API root domain) data for posts hosted at a different domain than where QuillReader is installed

### Changed

- Posts can be opened by clicking the title on the preview card
- Preview cards now use the post path instead of its ID by default
- Preview card titles are now `h2` elements instead of `h1`
- The tag search prefix is now "tag/" instead of "tag-"
- Preview cards only show three tags and display the number of hidden tags if there are more than that
- Rebuilt the routing system
- Post links style
- 'NSFW' tag is automatically moved to the start of the `tags` array
- `pathExists` now checks the `/metadata` endpoint to check if a post exists

### Removed

- The "Read more" button on preview cards has been removed
