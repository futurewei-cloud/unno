# API Documentation

Get the host ip by `curl ifconfig.me`

base path: hostname:port/api/v1

## Video
* Upload video: (POST)
    * /video
        * user {String}
        * video {String}
        * file {fileData}
 
* Delete video: (DELETE)
    * /video?video_id=123
 
* Modify video: (PATCH)
    * /video?video_id=123&...
` (NOTE: only save the video_name, other things could break the app)`
 
* Get videos: (GET)
    * /video?username=abc
    * /video?video_id=123

## Job
* Add job: (POST) `[NOTE: when job created, 'job_id' of this result will be updated accordingly]`
    * /job
    
        `{
"start_frame": 1,
"end_frame": 10,
"result_id": 23
}` 
 
* Modify job: (PATCH)
    * /job?job_id=1
 
* Get jobs: (GET)
    * /job?video_id=1
    * /job?job_id=1
    
## Annotation
 
* Add result: (POST)
    * /result
    
        `{"job_id":1, "video_id":1, "entity_id":111, "frame_num":5, "username":"abc", "status":"user"}` 

* Add results: (POST) `used for auto annotation`
    * /result
    
        `{"bbox":"310,140,120,120","end_frame":10,"entity_id":0,"job_id":0,"result_api":"http://10.145.83.34:8899/mirror",
         "start_frame":1,"tracking_results":{"2":"313,122,93,152","3":"322,145,74,173","4":"241,84,73,181",
         "5":"240,76,72,193","6":"242,72,72,203","7":"247,64,73,213","8":"251,53,73,225","9":"255,41,74,234"},
         "username":"abc","video_id":21`
 
* Delete result: (DELETE)
    * /result?result_id=1
    * /result?video_id=1 `optional: (&job_id=1&entity_id=111&frame_num=5)`
 
* Modify result: (PATCH)
    * /result?result_id=1 + at least one field to change `[NOTE: front-end should add 'status=user' to explicitly the result was generated by human]`
 
* Get results (GET):
    * /result?result_id=1
    * /result?video_id=1 `optional: (&job_id=1&entity_id=111&frame_num=5)`

## --Category
* Get categories: (GET)
    * /category  `[get all existing categories] `
    * /category?sup_cat_name=NAME `[get all categories under the supper category of NAME]`
    * /category?cat_id=ID `[get a category with ID]`
 
* Modify category: (PATCH)
    * /category
    
        `{"cat_id":1, "name":desk, "sup_cat_name":furniture}`
 
* Add new category: (POST)
    * /category
    
        `{"name":desk, "sup_cat_name":furniture}`
 
* Delete category: (DELETE)
    * /category?cat_id=ID
    * /category?name=NAME
    * /category?sup_cat_name=NAME

## --Entity
 `{
    entity_id: Number,
    video_id: Number,
    name: String,
    cat_id: Number
}`
 
* Get entities: (GET)
    * /entity?video_id=12345
 
* Add entity: (POST)
    * /entity
    
        `{"video_id":12345} returns new entity_id`
 
* Modify entity: (PATCH)
    * /entity
    
        `{"entity_id":2, ...}`
 
* Delete entity: (DELETE)
    * /entity?video_id=12345 `[delete all entities in given video]`
    * /entity?entity_id=12
`TODO: after frontend integration, to add foreign key of entity_id in annotation table, to enable automatic update annotations when updating entities
`

## --User
 
* Add user: (POST)
    * /user
    
        `{"username": "abc", "password": "***", "role": "admin"}`
 
* Delete user: (DELETE)
    * /user?username=abc
 
* Get user: (GET)
    * /user?username=abc