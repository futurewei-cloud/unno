# Unno
An AI-enabled, extensible and scalable video annotation platform.

## Introduction
Nowadays, the massive adoption of AI technologies relies on the availability of big data, computing power,
 and deep learning algorithms. It has become a routine to pipeline a project by collecting a large amount of high 
 quality labeled data, and build a deep learning model with GPU computing. However, it is very time-consuming and costly
 to collect large amounts of high quality labeled data. When it comes to collecting high quality labeled _video_ data,
 it becomes even harder. This motivates us to start this project to help users annotating videos automatically with 
 human in the loop.

Unno provides a data annotation solution of building model-backed assistive annotation pipeline. With the modular
 design, it is flexible to extent and scale advanced AI capabilities to boost annotation efficiency and 
 improve annotation quality.
 
### Supported features
V1:
* Video data import and management
* Bounding box annotation in video
* Category (class) annotation and entity (identification) annotation in video
* Model-based automatic entity tracking within video
* Annotation result export

## System overview
![overview](unno_system_overview.png)

The system is built upon individual modules, which are standalone services that can be containerized and deployed in 
different computing nodes. End-users only interact with the browser based UX Frontend. Communications across modules are
achieved by RESTful APIs.

* RawdataDB: object storage to host original data to be annotated.
* MetadataDB: database to host all meta data including actual annotations.
* DataManger: service as a data gateway to handle all data interactions between modules.
* JobManager: service to distribute AI model prediction jobs to available AI functionality nodes
* AI Functionality: automatic annotation generation service hosting AI models to achieve model based predictions. 
Customized AI capability can be instantiated as specific AI Functionality module.
* UX Frontend: web based user interface to manage data and conduct annotating process.

## Get Started
To run the system, both backend and frontend module should be started. 
* Follow [database service instructions
](BackendManager/README.md) to set up fundamental data infrastructure first.
* Then start the [data manager service](BackendManager/components/DataManager/README.md), and each of the AI 
Functionality modules (currently only the [tracking module](BackendFunctionalModule/tracking/README.md), you can add 
your own AI capability as you need).
* Launch the [job manager service](BackendManager/components/JobQueueManager/README.md) to handle all AI prediction requests.
* Build and publish the UX frontend with a web server with the [detailed instructions](Frontend/README.md)
* Open a web browser and hit your UX host. Enjoy data annotating!