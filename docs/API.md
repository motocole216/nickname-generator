# API Documentation

## Base URL
Production: `https://api.yournicknamegenerator.com/api`
Development: `http://localhost:3001/api`

## Endpoints

### Generate Nickname
`POST /generate`

Generates a nickname based on an uploaded image.

#### Request
- Content-Type: `multipart/form-data`
- Body:
  - `image`: File (JPEG, PNG, or WebP, max 5MB)

#### Response
```json
{
  "success": true,
  "data": {
    "nickname": "string",
    "imageUrl": "string"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "string",
    "code": "string"
  }
}
```

### Rate Limits
- 100 requests per 15 minutes per IP address
- Maximum file size: 5MB
- Supported image formats: JPEG, PNG, WebP

### Error Codes
- `INVALID_IMAGE`: Image format not supported or corrupted
- `FILE_TOO_LARGE`: Image exceeds 5MB limit
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

## Authentication
Currently, the API does not require authentication. All endpoints are public.

## Caching
- Successful responses are cached for 24 hours
- Cache can be bypassed by adding `?nocache=true` to the request URL

## Best Practices
1. Implement retry logic for failed requests
2. Optimize images before upload
3. Handle rate limiting gracefully
4. Check response status codes and error messages 