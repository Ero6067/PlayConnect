const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");

const Post = require("../../models/Posts");
const User = require("../../models/User");

//#region Create post
// @route   POSt api/posts
// @desc    Create a post
// @access  Private
router.post(
	"/",
	[
		auth,
		[
			check("text", "Text is required")
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");

			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id
			});

			const post = await newPost.save();

			res.json(post);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);
//#endregion

//#region Get all posts
// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});
//#endregion

//#region Get post by id
// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get("/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ msg: "Post not found" });
		}

		res.json(post);
	} catch (err) {
		// console.log(req.params.id);
		console.error(err.message);
		if (err.kind === "ObjectId" || req.params.id.length != 24) {
			return res.status(400).json({ msg: "Post not found" });
		}
		res.status(500).send("Server Error");
	}
});
//#endregion

//#region Delete a posts
// @route   GET api/posts/:id
// @desc    Delet a post
// @access  Private
router.delete("/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ msg: "Post not found" });
		}

		// Check user
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User not authorized" });
		}
		await post.remove();

		res.json({ msg: "Post removed" });
	} catch (err) {
		console.error(err.message);
		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: "Post not found" });
		}
		res.status(500).send("Server Error");
	}
});
//#endregion

//#region Like a post
// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put("/like/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		//Check if post has been liked by this user
		if (
			post.likes.filter(like => like.user.toString() === req.user.id).length > 0
		) {
			return res.status(400).json({ msg: "Post already liked" });
		}
		post.likes.unshift({ user: req.user.id });

		await post.save();

		res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});
//#endregion

//#region Unlike a post
// @route    PUT api/posts/like/:id
// @desc     Unlike a post
// @access   Private
router.put("/unlike/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		//Check if post has been liked by this user
		if (
			post.likes.filter(like => like.user.toString() === req.user.id).length ===
			0
		) {
			return res.status(400).json({ msg: "Post has not been liked" });
		}
		// Get remove index
		const removeIndex = post.likes
			.map(like => like.user.toString())
			.indexOf(req.user.id);

		post.likes.splice(removeIndex, 1);

		await post.save();

		res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});
//#endregion

//#region Comment on a post
// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
	"/comment/:id",
	auth,
	[
		check("text", "Text is required")
			.not()
			.isEmpty()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");
			const post = await Post.findById(req.params.id);

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id
			};

			post.comments.unshift(newComment);

			await post.save();

			res.json(post.comments);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);
//#endregion

//#region Remove a comment
// @route    Delete api/posts/comment/:id/:comment_id
// @desc     Remove a comment from a post
// @access   Private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if (!post) {
			return res.status(404).json({ msg: "Post does not exist" });
		}
		//Pull out comment
		const comment = post.comments.find(
			comment => comment.id.toString() === req.params.comment_id
		);

		//Make sure comment exists
		if (!comment) {
			return res.status(400).json({ msg: "Comment does not exist" });
		}
		// check user
		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User not authorized" });
		}
		// Get remove index
		const removeIndex = post.comments
			.map(comment => comment.id.toString())
			.indexOf(req.params.comment_id);
		// Remove Id
		post.comments.splice(removeIndex, 1);

		await post.save();

		res.json(post.comments);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});
//#endregion

//TODO update comments

module.exports = router;
