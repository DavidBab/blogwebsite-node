import express from 'express';
import bodyParser from 'body-parser';
import fs, { write } from 'fs';
import path from 'path';

const app = express();
const port = 3000;
const postIDFilePath = path.join('postID.json');
let postID = 1;

// Middleware applications
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Check if postID file exists and read the postID from it
if (fs.existsSync(postIDFilePath)) {
	const postIDData = fs.readFileSync(postIDFilePath, 'utf8');
	if (postIDData) {
		postID = JSON.parse(postIDData).postID;
	}
}

// Route to render the homepage with posts sorted by latest post using timestamp
app.get('/', (req, res) => {
	const filePath = path.join('posts.json');
	fs.readFile(filePath, 'utf8', (err, fileData) => {
		let posts = [];
		if (fileData) {
			posts = JSON.parse(fileData);
		}

		// Sort posts by timestamp in descending order
		posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

		// Render the index.ejs template with the posts
		res.render('index.ejs', { posts: posts });
	});
});

// Route to render the about page
app.get('/about', (req, res) => {
	res.render('about.ejs');
});

// Route to render the post creation page
app.get('/post', (req, res) => {
	res.render('post.ejs');
});

// Route to render the contact page
app.get('/contact', (req, res) => {
	res.render('contact.ejs');
});

// Getting the webpage for a specific ID
app.get('/post/id=:id', (req, res) => {
	const postId = parseInt(req.params.id, 10);
	const filePath = path.join('posts.json');

	fs.readFile(filePath, 'utf8', (err, fileData) => {
		handleError(err);

		let arr = [];
		if (fileData) {
			arr = JSON.parse(fileData);
		}

		// Find the post with the given ID
		const post = arr.find(p => p.id === postId);

		if (post) {
			const postData = post;
			// Render the posted.ejs template with the post data
			res.render('posted.ejs', {
				post: postData,
			});
		} else {
			res.status(404).send('Post not found');
		}
	});
});

// Route to handle post submission
app.post('/post/submit', (req, res) => {
	const data = req.body;
	const filePath = path.join('posts.json');

	// Assign a new ID to the post
	data.id = postID;

	// Write the contact data to the contacts.json file
	writeJSON(data, filePath);

	// Redirect to the homepage after successful submission
	res.redirect('/');
});

// Route to handle contact form submission
app.post('/contact/submit', (req, res) => {
	const data = req.body;
	const filePath = path.join('contacts.json');

	// Write the contact data to the contacts.json file
	writeJSON(data, filePath);

	// Redirect to the homepage after successful submission
	res.redirect('/');
});

// App listening
app.listen(port, () => console.log('Running on port ' + port));

// Function for writing files into a JSON document.
function writeJSON(data, filePath) {
	fs.readFile(filePath, 'utf8', (err, fileData) => {
		handleError(err);

		let arr = [];
		if (fileData) {
			arr = JSON.parse(fileData);
		}

		data.timestamp = new Date().toISOString();

		// Add the new post to the posts array
		arr.push(data);

		// Increment the postID and save it to the file
		postID++;
		fs.writeFileSync(postIDFilePath, JSON.stringify({ postID: postID }));

		// Write the updated array to the file
		fs.writeFile(filePath, JSON.stringify(arr, null, 2), err => {
			if (err) {
				console.error('Error writing file:', err);
				return res.status(500).send('Internal Server Error');
			}
		});
	});
}

function handleError(err) {
	if (err) {
		console.error('Error reading file:', err);
		return res.status(500).send('Internal Server Error');
	}
}
