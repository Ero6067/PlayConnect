const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

//#region Get Profile
// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get("/me", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id
		}).populate("user", ["name", "avatar"]);

		if (!profile) {
			return res.status(400).json({ msg: "There is no profile for this user" });
		}

		res.json(profile);
	} catch (err) {
		console.log(err.message);
		res.status(500).send("Server Error");
	}
});
//#endregion

//#region Create or update profile
// @route   POST api/profile
// @desc    Create or update a user profile
// @access  Private

router.post(
	"/",
	[
		auth,
		check("status", "Status is required")
			.not()
			.isEmpty(),
		check("skills", "Skills is required")
			.not()
			.isEmpty()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			company,
			website,
			location,
			bio,
			status,
			githubusername,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin
		} = req.body;

		//Build profile object
		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(",").map(skill => skill.trim());
		}

		//Build social object
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (facebook) profileFields.social.facebook = facebook;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (instagram) profileFields.social.instagram = instagram;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				//Update
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);

				return res.json(profile);
			}

			// Create
			profile = new Profile(profileFields);

			await profile.save();
			res.json(profile);
		} catch (err) {
			console.log(err.message);
			res.status(500).send("Server Error");
		}
	}
);
//#endregion

//#region Get all profiles
// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get("/", async (req, res) => {
	try {
		const profiles = await Profile.find().populate("user", ["name", "avatar"]);
		res.json(profiles);
	} catch (err) {
		console.log(err.message);
		res.status(500).send("Server Error");
	}
});
//#endregion

//#region Get profile by ID
// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get("/user/:user_id", async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id
		}).populate("user", ["name", "avatar"]);

		if (!profile) return res.status(400).json({ msg: "Profile not found" });
		res.json(profile);
	} catch (err) {
		console.log(err.message);
		if (err.kind == "ObjectId") {
			return res.status(400).json({ msg: "Profile not found" });
		}
		res.status(500).send("Server Error");
	}
});
//#endregion

//#region Delete profile
// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private
router.delete("/", auth, async (req, res) => {
	try {
		// @TODO - remove users posts

		// Remove profile
		await Profile.findOneAndRemove({
			user: req.user.id
		});

		//Remove the user
		await User.findOneAndRemove({
			_id: req.user.id
		});

		res.json({ msg: "User deleted" });
	} catch (err) {
		console.log(err.message);
		if (err.kind == "ObjectId") {
			return res.status(400).json({ msg: "Profile not found" });
		}
		res.status(500).send("Server Error");
	}
});
//#endregion

//#region Add experience
// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
	"/experience",
	[
		auth,
		[
			check("title", "Title is required")
				.not()
				.isEmpty(),
			check("company", "Company is required")
				.not()
				.isEmpty(),
			check("from", "From date is required")
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		} = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		};

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				profile = await Profile.findOneAndUpdate({ user: req.user.id });
				return res.json(profile);
			}

			profile.experience.unshift(newExp);

			await profile.save();
			res.json(profile);
		} catch (err) {
			console.log(err.message);
			res.status(500).send("Server Error");
		}
	}
);
//#endregion

//#region Update experience
// @route   PUT api/profile/experience/:exp_id
// @desc    Edit profile experience
// @access  Private
router.put(
	"/experience/:exp_id",
	[
		auth,
		check("title", "Title is required")
			.not()
			.isEmpty(),
		check("company", "Company is required")
			.not()
			.isEmpty(),
		check("from", "From date is required")
			.not()
			.isEmpty()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		} = req.body;

		// since title, company, from are required
		const exp = { title, company, from };
		if (location) exp.location = location;
		if (to) exp.to = to;
		if (current) exp.current = current;
		if (description) exp.description = description;

		try {
			const profile = await Profile.findOneAndUpdate(
				// note that I wrote 'userid' instead of 'user'
				{ user: req.user.id, "experience._id": req.params.exp_id },
				{
					$set: {
						// I don't want my experience id to change
						"experience.$": { _id: req.params.exp_id, ...exp }
					}
				},
				{ new: true }
			);
			res.json(profile);
		} catch (err) {
			console.log(err.message);
			res.status(500).send("Server Error");
		}
	}
);
//#endregion

//#region
// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete profile experience
// @access  Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		//Get remove index
		const removeIndex = profile.experience
			.map(item => item.id)
			.indexOf(req.params.exp_id);

		profile.experience.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);
	} catch (err) {
		console.log(err.message);
		res.status(500).send("Server Error");
	}
});
//#endregion
module.exports = router;
