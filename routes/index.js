let express = require("express");
let router = express.Router();
const UserController = require("../services/userController");

const userController = new UserController();

router.get("/listsession", (req, res) =>
  userController.getSessionsData(req, res)
);

router.get("/interaction", (req, res) =>
  userController.getInteractionFilter(req, res)
);

router.post("/interaction", (req, res) =>
  userController.updateInteractionFilter(req, res)
);

router.get("/sessionName", (req, res) =>
  userController.getSessionsName(req, res)
);

router.get("/all", (req, res) => userController.getAllData(req, res));

router.get("/consecutive", (req, res) =>
  userController.fetchFrequentFailed(req, res)
);

router.get("/burst/:session_name", (req, res) =>
  userController.getBurstData(req, res)
);

router.get("/burst", (req, res) => userController.getBurstData(req, res));

router.get("/provider", (req, res) => userController.getProviderData(req, res));

module.exports = router;
