UPDATE books 
SET cover_url = 'https://books.google.com/books/content?id=YOUR_ID&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    cover_source = 'google-books'
WHERE isbn = '9781259862991';
