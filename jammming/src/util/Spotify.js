const clientId = '54fd1aae688a42148a3229956286e069';
const redirectURI = 'http://localhost:3000/';
let accessToken = null;

const Spotify = {
	getAccessToken() {
		if (accessToken) {
			return new Promise(
				resolve => resolve(accessToken)
			);
		} else {
			const accessTokenCheck = window.location.href.match(/access_token=([^&]*)/);
			const expiresInCheck = window.location.href.match(/expires_in=([^&]*)/);

			if (accessTokenCheck && expiresInCheck) {
				accessToken = accessTokenCheck[1];

				const expiresIn = expiresInCheck[1];

				window.setTimeout(() => accessToken = '', expiresIn * 1000);
				window.history.pushState('Access Token', null, '/');
			} else {
				window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
			}

			return new Promise(
				resolve => resolve(accessToken)
			);
		}
	},

	search(term) {
		return Spotify.getAccessToken().then(() => {
			return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			}).then(response => {
				if (response.ok) {
					return response.json();
				}

				throw new Error('Request failed!');
			}).then(jsonResponse => {
				if (jsonResponse.tracks) {
					return jsonResponse.tracks.items && jsonResponse.tracks.items.map(track => {
						return {
							id: track.id,
							name: track.name,
							artist: track.artists[0].name,
							album: track.album.name,
							uri: track.uri
						};
					});
				}

				return [];
			});
		});
	},

	savePlaylist(playlistName, trackURIs) {
		if (!playlistName || !trackURIs) {
			return;
		}

		const headers = {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		};
		let userId = null;

		return fetch('https://api.spotify.com/v1/me', {
			headers: headers
		}).then(response => {
			if (response.ok) {
				return response.json();
			}

			throw new Error('Request failed!');
		}).then(jsonResponse => {
			userId = jsonResponse.id;

			return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
				headers: headers,
				method: 'POST',
				body: JSON.stringify({
					name: playlistName
				})
			}).then(response => {
				if (response.ok) {
					return response.json();
				}

				throw new Error('Request failed!');
			}).then(jsonResponse => {
				const playlistId = jsonResponse.id;

				return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
					headers: headers,
					method: 'POST',
					body: JSON.stringify({
						uris: trackURIs
					})
				});
			});
		});
	}
};

export default Spotify;
