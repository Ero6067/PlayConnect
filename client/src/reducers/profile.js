import {
	GET_PROFILE,
	PROFILE_ERROR,
	CLEAR_PROFILE,
	UPDATE_PROFILE,
	GET_PROFILES,
	GET_REPOS,
	RESET_PROFILE_LOADING,
} from "../actions/types";

const initState = {
	profile: null,
	profiles: [],
	repos: [],
	loading: true,
	error: {},
};

export default function (state = initState, action) {
	const { type, payload } = action;

	switch (type) {
		case GET_PROFILE:
		case UPDATE_PROFILE:
			return {
				...state,
				profile: payload,
				loading: false,
			};
		case GET_PROFILES:
			return {
				...state,
				profiles: payload,
				loading: false,
			};
		case PROFILE_ERROR:
			return {
				...state,
				error: payload,
				loading: false,
				prodile: null,
			};
		case CLEAR_PROFILE:
			return {
				...state,
				profile: null,
				repos: [],
				loading: false,
			};
		case GET_REPOS:
			return {
				...state,
				repos: payload,
				loading: false,
			};
		case RESET_PROFILE_LOADING:
			return {
				...state,
				loading: true,
			};
		default:
			return state;
	}
}
