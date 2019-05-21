module.exports = () => {
    if (window.confirm([
        'Thank you for showing the interests to our preview feature, you are just one step away from it.',
        'As we store all the cool examples in GitHub, it is required to set up your Personal Access Token to allow us to check out them on your behave.',
    ].join('\n'))) {
        location.href = '/change-github-pat.html';
        return true;
    } else {
        return false;
    }
};
