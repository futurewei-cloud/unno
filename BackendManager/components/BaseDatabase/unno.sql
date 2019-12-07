-- phpMyAdmin SQL Dump
-- version 3.4.10.1deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 01, 2019 at 10:50 PM
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
  `annotation_id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) DEFAULT NULL,
  `video_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `frame_num` int(11) NOT NULL,
  `status` varchar(20) NOT NULL,
  `last_modified_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bbox` varchar(256) NOT NULL,
  PRIMARY KEY (`annotation_id`),
  UNIQUE KEY `job_frame` (`job_id`,`video_id`,`entity_id`,`frame_num`),
  KEY `username` (`username`),
  KEY `video_id` (`video_id`),
  KEY `job_id` (`job_id`),
  KEY `entity_id` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=0 ;

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
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=80 ;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`cat_id`, `name`, `sup_cat_name`) VALUES
(0, '', ''),
(1, 'person', 'person'),
(2, 'bicycle', 'vehicle'),
(3, 'car', 'vehicle'),
(4, 'motorcycle', 'vehicle'),
(5, 'airplane', 'vehicle'),
(6, 'bus', 'vehicle'),
(7, 'train', 'vehicle'),
(8, 'truck', 'vehicle'),
(9, 'boat', 'vehicle'),
(10, 'traffic light', 'outdoor'),
(11, 'fire hydrant', 'outdoor'),
(12, 'stop sign', 'outdoor'),
(13, 'parking meter', 'outdoor'),
(14, 'bench', 'outdoor'),
(15, 'bird', 'animal'),
(16, 'cat', 'animal'),
(17, 'dog', 'animal'),
(18, 'horse', 'animal'),
(19, 'sheep', 'animal'),
(20, 'cow', 'animal'),
(21, 'elephant', 'animal'),
(22, 'bear', 'animal'),
(23, 'zebra', 'animal'),
(24, 'giraffe', 'animal'),
(25, 'backpack', 'accessory'),
(26, 'umbrella', 'accessory'),
(27, 'handbag', 'accessory'),
(28, 'tie', 'accessory'),
(29, 'suitcase', 'accessory'),
(30, 'frisbee', 'sports'),
(31, 'skis', 'sports'),
(32, 'snowboard', 'sports'),
(33, 'sports ball', 'sports'),
(34, 'kite', 'sports'),
(35, 'baseball bat', 'sports'),
(36, 'baseball glove', 'sports'),
(37, 'skateboard', 'sports'),
(38, 'surfboard', 'sports'),
(39, 'tennis racket', 'sports'),
(40, 'bottle', 'kitchen'),
(41, 'wine glass', 'kitchen'),
(42, 'cup', 'kitchen'),
(43, 'fork', 'kitchen'),
(44, 'knife', 'kitchen'),
(45, 'spoon', 'kitchen'),
(46, 'bowl', 'kitchen'),
(47, 'banana', 'food'),
(48, 'apple', 'food'),
(49, 'sandwich', 'food'),
(50, 'orange', 'food'),
(51, 'broccoli', 'food'),
(52, 'carrot', 'food'),
(53, 'hot dog', 'food'),
(54, 'pizza', 'food'),
(55, 'donut', 'food'),
(56, 'cake', 'food'),
(57, 'chair', 'furniture'),
(58, 'couch', 'furniture'),
(59, 'potted plant', 'furniture'),
(60, 'bed', 'furniture'),
(61, 'dining table', 'furniture'),
(62, 'toilet', 'furniture'),
(63, 'tv', 'electronic'),
(64, 'laptop', 'electronic'),
(65, 'mouse', 'electronic'),
(66, 'remote', 'electronic'),
(67, 'keyboard', 'electronic'),
(68, 'cell phone', 'electronic'),
(69, 'microwave', 'appliance'),
(70, 'oven', 'appliance'),
(71, 'toaster', 'appliance'),
(72, 'sink', 'appliance'),
(73, 'refrigerator', 'appliance'),
(74, 'book', 'indoor'),
(75, 'clock', 'indoor'),
(76, 'vase', 'indoor'),
(77, 'scissors', 'indoor'),
(78, 'teddy bear', 'indoor'),
(79, 'hair drier', 'indoor'),
(80, 'toothbrush', 'indoor');

-- --------------------------------------------------------
--
-- Table structure for table `entity`
--

CREATE TABLE IF NOT EXISTS `entity` (
  `entity_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) DEFAULT NULL,
  `cat_id` int(11) NOT NULL DEFAULT '0',
  `video_id` int(11) NOT NULL,
  PRIMARY KEY (`entity_id`),
  KEY `cat_id` (`cat_id`),
  KEY `video_id` (`video_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0 ;

-- --------------------------------------------------------

--
-- Table structure for table `function`
--

CREATE TABLE IF NOT EXISTS `function` (
  `server_id` int(11) NOT NULL AUTO_INCREMENT,
  `endpoint` varchar(100) NOT NULL,
  `status` int(11) NOT NULL,
  `desc` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`server_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `function`
--

INSERT INTO `function` (`server_id`, `endpoint`, `status`, `desc`) VALUES
(1, 'http://10.145.83.34:8899/tracking/api/sot', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job`
--

CREATE TABLE IF NOT EXISTS `job` (
  `job_id` int(11) NOT NULL AUTO_INCREMENT,
  `job_name` varchar(100) DEFAULT NULL,
  `video_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `bbox` varchar(256) NOT NULL,
  `start_frame` int(11) NOT NULL,
  `end_frame` int(11) NOT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`job_id`),
  KEY `username` (`username`),
  KEY `video_id` (`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=0 ;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `last_modified_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_time` timestamp NULL DEFAULT NULL,
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
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `status` varchar(64) NOT NULL DEFAULT 'normal',
  PRIMARY KEY (`video_id`),
  KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=0 ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `annotation`
--
ALTER TABLE `annotation`
  ADD CONSTRAINT `annotation_ibfk_3` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`entity_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `annotation_ibfk_1` FOREIGN KEY (`video_id`) REFERENCES `video` (`video_id`),
  ADD CONSTRAINT `annotation_ibfk_2` FOREIGN KEY (`username`) REFERENCES `user` (`username`);

--
-- Constraints for table `entity`
--
ALTER TABLE `entity`
  ADD CONSTRAINT `entity_ibfk_3` FOREIGN KEY (`video_id`) REFERENCES `video` (`video_id`) ON DELETE NO ACTION,
  ADD CONSTRAINT `entity_ibfk_1` FOREIGN KEY (`cat_id`) REFERENCES `category` (`cat_id`) ON DELETE NO ACTION;

--
-- Constraints for table `job`
--
ALTER TABLE `job`
  ADD CONSTRAINT `job_ibfk_1` FOREIGN KEY (`video_id`) REFERENCES `video` (`video_id`),
  ADD CONSTRAINT `job_ibfk_2` FOREIGN KEY (`username`) REFERENCES `user` (`username`);

--
-- Constraints for table `video`
--
ALTER TABLE `video`
  ADD CONSTRAINT `video_ibfk_1` FOREIGN KEY (`username`) REFERENCES `user` (`username`);


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;