# AuthenticationFreeApi

This is a small frontend authentication project I built with plain HTML, CSS, and JavaScript. The app talks to the FreeAPI users endpoints and covers the usual flow: register, log in, stay signed in with a saved token, view the current user's details, and log out again.

There is no framework and no backend inside this repo. Everything runs from a few static files in the browser, which makes it easy to read through and understand.

## What the app does

The app has three main parts:

- a login screen
- a registration screen
- a small profile page

On the login and register screens, users can switch between forms, enter their details, and get inline validation errors if something is missing or invalid. After login, the app stores the access token in `localStorage`, fetches the current user, and shows a minimal profile page with basic account details.

## API used

The app uses the FreeAPI user endpoints:

```txt
https://api.freeapi.app/api/v1/users
```

Requests used in the project:

- `POST /register`
- `POST /login`
- `POST /logout`
- `GET /current-user`

## How it works

When a user signs up, the app validates the form on the client side first and then sends the registration request. After a successful response, it takes the user back to the login screen.

When a user logs in, the app sends the credentials to the API, saves the returned token in `localStorage`, and immediately loads the current user data. That user data is then used to fill the profile section.

When the page opens, the app checks whether a token is already saved. If it finds one, it tries to restore the session by calling the current-user endpoint. If that fails, it clears the token and sends the user back to login.

Logout is handled by calling the logout endpoint, clearing the saved token, resetting the profile UI, and returning to the login screen.

## Why this project is useful

This is a good practice project if you want to understand how a basic authentication flow works in vanilla JavaScript without hiding the details behind a framework. The code is small enough to follow, but still covers real pieces like API requests, validation, session restore, loading states, and UI updates after authentication.
