const {
  fetchProviderData,
  fetchAllDataBurstMax,
  fetchAllData,
  fetchAllSessionData,
  fetchAllSessionName,
  fetchFrequentFailed,
} = require("./dataQuery");

class UserController {
  constructor() {
    this.filter = {
      duration: "SECOND",
      sdate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      edate: new Date().toISOString(),
    };
  }

  setFilter(newFilter) {
    this.filter = newFilter; // Completely overwrite the filter
  }

  updateInteractionFilter(req, res) {
    try {
      // Extract filter from request body
      const filter = req.body;

      // Validate filter
      if (!filter || typeof filter !== "object") {
        throw new Error("Invalid filter format");
      }

      // Update the filter
      this.setFilter(filter);

      // Send success response
      res.status(200).send({ message: "Filter updated successfully" });
    } catch (error) {
      // Log error and send error response
      console.error("Error updating filter:", error);
      res.status(400).send({
        message: "Error updating filter",
        error: error.message,
      });
    }
  }

  getInteractionFilter(req, res) {
    try {
      res.status(200).send(this.filter);
    } catch (error) {
      console.error("Error getting filter:", error);
      res.status(500).send({
        message: "Error getting filter",
        error: error.message,
      });
    }
  }

  async getSessionsData(req, res) {
    try {
      console.log("Fetching user data with filter:", this.filter);
      const data = await fetchAllSessionData(this.filter);
      res.status(200).send(data);
    } catch (error) {
      console.error("Error fetching sessions data:", error);
      res.status(500).send({
        message: "Error fetching sessions data",
        error: error.message,
      });
    }
  }

  async getSessionsName(req, res) {
    try {
      const data = await fetchAllSessionName();
      res.status(200).send(data);
    } catch (error) {
      console.error("Error fetching sessions name:", error);
      res.status(500).send({
        message: "Error fetching sessions name",
        error: error.message,
      });
    }
  }

  async getAllData(req, res) {
    try {
      const data = await fetchAllData(this.filter);
      res.status(200).send(data);
    } catch (error) {
      console.error("Error fetching sessions name:", error);
      res.status(500).send({
        message: "Error fetching sessions name",
        error: error.message,
      });
    }
  }

  async fetchFrequentFailed(req, res) {
    try {
      const data = await fetchFrequentFailed(this.filter);
      res.status(200).send(data);
    } catch {
      console.error("Error fetching sessions name:", error);
      res.status(500).send({
        message: "Error fetching sessions name",
        error: error.message,
      });
    }
  }

  async getBurstData(req, res) {
    try {
      const { session_name } = req.params;
      const data = await fetchAllDataBurstMax(this.filter, session_name);
      res.status(200).send(data);
    } catch (error) {
      console.error("Error fetching sessions name:", error);
      res.status(500).send({
        message: "Error fetching sessions name",
        error: error.message,
      });
    }
  }

  async getProviderData(req, res) {
    try {
      const data = await fetchProviderData(this.filter);
      res.status(200).send(data);
    } catch (error) {
      console.error("Error fetching sessions name:", error);
      res.status(500).send({
        message: "Error fetching sessions name",
        error: error.message,
      });
    }
  }
}

module.exports = UserController;
