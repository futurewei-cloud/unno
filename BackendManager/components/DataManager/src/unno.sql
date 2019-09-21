-- phpMyAdmin SQL Dump
-- version 3.4.10.1deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 20, 2019 at 11:57 PM
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
  KEY `username` (`username`),
  KEY `video_id` (`video_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0 ;

--
-- Dumping data for table `annotation`
--

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE IF NOT EXISTS `category` (
  `cat_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(1024) NOT NULL,
  `sup_cat_name` varchar(1024) NOT NULL,
  PRIMARY KEY (`cat_id`),
  UNIQUE KEY `name` (`name`(255))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`cat_id`, `name`, `sup_cat_name`) VALUES
(1, 'person', 'person'),
(2, 'bicycle', 'vehicle'),
(3, 'car', 'vehicle');

-- ---------------------------------------------------------
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
  `job_id` int(11) DEFAULT NULL,
  `video_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `cat_id` int(11) DEFAULT NULL,
  `frame_num` int(11) NOT NULL,
  `status` varchar(20) NOT NULL,
  `last_modified_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bbox` varchar(100) NOT NULL,
  PRIMARY KEY (`result_id`),
  UNIQUE KEY `job_frame` (`job_id`,`video_id`,`entity_id`,`frame_num`),
  KEY `username` (`username`),
  KEY `video_id` (`video_id`),
  KEY `job_id` (`job_id`),
  KEY `cat_id` (`cat_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0 ;

--
-- Dumping data for table `result`
--

-- --------------------------------------------------------

--
-- Table structure for table `server`
--

CREATE TABLE IF NOT EXISTS `server` (
  `server_id` int(11) NOT NULL AUTO_INCREMENT,
  `endpoint` varchar(100) NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`server_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

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
  `last_modified_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_time` timestamp NULL,
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
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=27 ;

--
-- Dumping data for table `video`
--

INSERT INTO `video` (`video_id`, `video_name`, `username`, `format`, `fps`, `num_frames`, `s3_location`) VALUES
(21, 'catdog.mp4', 'abcd', 'mp4', 30, 451, ''),
(23, 'SampleVideo_1280x720_1mb.mp4', 'abcd', 'mp4', 25, 132, ''),
(26, 'Kid at Park.mp4', 'abcd', 'mp4', 25, 319, '');

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
  ADD CONSTRAINT `result_ibfk_2` FOREIGN KEY (`username`) REFERENCES `user` (`username`);

--
-- Constraints for table `video`
--
ALTER TABLE `video`
  ADD CONSTRAINT `video_ibfk_1` FOREIGN KEY (`username`) REFERENCES `user` (`username`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
