-- phpMyAdmin SQL Dump
-- version 3.4.10.1deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jul 09, 2019 at 06:29 PM
-- Server version: 5.5.22
-- PHP Version: 5.3.10-1ubuntu3

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `unno`
--
CREATE DATABASE `unno` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `unno`;

-- --------------------------------------------------------

--
-- Table structure for table `annotation`
--

CREATE TABLE IF NOT EXISTS `annotation` (
  `job_id` int(11) NOT NULL AUTO_INCREMENT,
  `job_name` varchar(100) NOT NULL,
  `video_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `entity_name` varchar(100) NOT NULL,
  `bbox` varchar(100) NOT NULL,
  `start_frame` int(11) NOT NULL,
  `end_frame` int(11) NOT NULL,
  `status` varchar(20) NOT NULL,
  `s3_location` varchar(100) NOT NULL,
  PRIMARY KEY (`job_id`),
  UNIQUE KEY `job_name` (`job_name`,`username`),
  UNIQUE KEY `video_id_2` (`video_id`,`entity_id`),
  UNIQUE KEY `video_id_3` (`video_id`,`entity_name`),
  KEY `username` (`username`),
  KEY `video_id` (`video_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `annotation`
--

INSERT INTO `annotation` (`job_id`, `job_name`, `video_id`, `username`, `entity_id`, `entity_name`, `bbox`, `start_frame`, `end_frame`, `status`, `s3_location`) VALUES
(1, 'job1', 16, 'abcd', 1, 'person1', '1,1,10,10', 1, 5, 'new', '');


-- --------------------------------------------------------

--
-- Table structure for table `model`
--

CREATE TABLE IF NOT EXISTS `model` (
  `model_name` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `framework` varchar(100) NOT NULL,
  `version` int(11) NOT NULL,
  `description` varchar(100) NOT NULL,
  PRIMARY KEY (`model_name`),
  KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `result`
--

CREATE TABLE IF NOT EXISTS `result` (
  `result_id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `frame_num` int(11) NOT NULL,
  `status` varchar(20) NOT NULL,
  `last_modified_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `bbox` varchar(100) NOT NULL,
  PRIMARY KEY (`result_id`),
  UNIQUE KEY `job_frame` (`job_id`,`video_id`,`entity_id`,`frame_num`),
  KEY `username` (`username`),
  KEY `video_id` (`video_id`),
  KEY `job_id` (`job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `server`
--

CREATE TABLE IF NOT EXISTS `server` (
  `server_id` int(11) NOT NULL AUTO_INCREMENT,
  `endpoint` varchar(100) NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`server_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `server`
--

INSERT INTO `server` (`server_id`, `endpoint`, `status`) VALUES
(1, 'http://10.145.83.34:8899/tracking/api/sot', 0);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `last_modified_time` timestamp NULL DEFAULT NULL,
  `last_login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`username`, `password`, `last_modified_time`, `last_login_time`, `role`) VALUES
('abcd', 'abcd', '2019-08-08 22:59:49', '2019-08-08 22:59:49', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `video`
--

CREATE TABLE IF NOT EXISTS `video` (
  `video_id` int(11) NOT NULL AUTO_INCREMENT,
  `video_name` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `format` varchar(100) NOT NULL,
  `fps` int(11) NOT NULL,
  `num_frames` int(11) NOT NULL,
  `s3_location` varchar(100) NOT NULL,
  PRIMARY KEY (`video_id`),
  UNIQUE KEY `video_name` (`video_name`,`username`),
  KEY `username` (`username`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `video`
--

INSERT INTO `video` (`video_id`, `video_name`, `username`, `format`, `fps`, `num_frames`, `s3_location`) VALUES
(16, 'catdog.mp4', 'abcd', 'mp4', 0, 0, '');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `annotation`
--
ALTER TABLE `annotation`
  ADD CONSTRAINT `annotation_ibfk_1` FOREIGN KEY (`video_id`) REFERENCES `video` (`video_id`),
  ADD CONSTRAINT `annotation_ibfk_2` FOREIGN KEY (`username`) REFERENCES `user` (`username`);

--
-- Constraints for table `result`
--
ALTER TABLE `result`
  ADD CONSTRAINT `result_ibfk_1` FOREIGN KEY (`video_id`) REFERENCES `video` (`video_id`),
  ADD CONSTRAINT `result_ibfk_2` FOREIGN KEY (`username`) REFERENCES `user` (`username`),
  ADD CONSTRAINT `result_ibfk_3` FOREIGN KEY (`job_id`) REFERENCES `annotation` (`job_id`);

--
-- Constraints for table `video`
--
ALTER TABLE `video`
  ADD CONSTRAINT `video_ibfk_1` FOREIGN KEY (`username`) REFERENCES `user` (`username`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
