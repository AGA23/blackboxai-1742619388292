const { Branch, User, Appointment, DoctorBranch } = require('../models');
const { APIError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');

class BranchController {
  /**
   * Create a new branch
   * @route POST /api/branches
   */
  static async create(req, res, next) {
    try {
      const {
        name,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        operatingHours,
        capacity,
        services,
        coordinates
      } = req.body;

      // Check if branch with same name exists
      const existingBranch = await Branch.findOne({ where: { name } });
      if (existingBranch) {
        throw new APIError(409, 'Branch with this name already exists');
      }

      const branch = await Branch.create({
        name,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        operatingHours,
        capacity,
        services,
        coordinates,
        status: 'active'
      });

      res.status(201).json({
        status: 'success',
        data: {
          branch
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all branches
   * @route GET /api/branches
   */
  static async getAll(req, res, next) {
    try {
      const { city, state, status } = req.query;

      // Build query conditions
      const where = {};
      if (city) where.city = city;
      if (state) where.state = state;
      if (status) where.status = status;

      const branches = await Branch.findAll({
        where,
        include: [
          {
            model: User,
            through: DoctorBranch,
            as: 'doctors',
            attributes: ['id', 'firstName', 'lastName', 'specialization'],
            where: { role: 'doctor', status: 'active' },
            required: false
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        status: 'success',
        data: {
          branches
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get branch by ID
   * @route GET /api/branches/:id
   */
  static async getById(req, res, next) {
    try {
      const branch = await Branch.findByPk(req.params.id, {
        include: [
          {
            model: User,
            through: DoctorBranch,
            as: 'doctors',
            attributes: ['id', 'firstName', 'lastName', 'specialization'],
            where: { role: 'doctor', status: 'active' },
            required: false
          }
        ]
      });

      if (!branch) {
        throw new APIError(404, 'Branch not found');
      }

      // Get current capacity status
      const capacityStatus = await branch.getCurrentCapacity();

      res.json({
        status: 'success',
        data: {
          branch,
          capacityStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update branch
   * @route PATCH /api/branches/:id
   */
  static async update(req, res, next) {
    try {
      const branch = await Branch.findByPk(req.params.id);

      if (!branch) {
        throw new APIError(404, 'Branch not found');
      }

      const allowedUpdates = [
        'name',
        'address',
        'city',
        'state',
        'zipCode',
        'phone',
        'email',
        'operatingHours',
        'status',
        'capacity',
        'services',
        'coordinates'
      ];

      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      if (Object.keys(updates).length === 0) {
        throw new APIError(400, 'No valid update fields provided');
      }

      // If name is being updated, check for duplicates
      if (updates.name && updates.name !== branch.name) {
        const existingBranch = await Branch.findOne({
          where: { name: updates.name }
        });
        if (existingBranch) {
          throw new APIError(409, 'Branch with this name already exists');
        }
      }

      await branch.update(updates);

      res.json({
        status: 'success',
        data: {
          branch
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign doctor to branch
   * @route POST /api/branches/:id/doctors
   */
  static async assignDoctor(req, res, next) {
    try {
      const { doctorId } = req.body;
      const branchId = req.params.id;

      // Verify branch exists
      const branch = await Branch.findByPk(branchId);
      if (!branch) {
        throw new APIError(404, 'Branch not found');
      }

      // Verify doctor exists and is active
      const doctor = await User.findOne({
        where: { id: doctorId, role: 'doctor', status: 'active' }
      });
      if (!doctor) {
        throw new APIError(404, 'Doctor not found or inactive');
      }

      // Check if assignment already exists
      const existingAssignment = await DoctorBranch.findOne({
        where: { doctorId, branchId }
      });
      if (existingAssignment) {
        throw new APIError(409, 'Doctor is already assigned to this branch');
      }

      // Create assignment
      await DoctorBranch.create({ doctorId, branchId });

      res.json({
        status: 'success',
        message: 'Doctor assigned to branch successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove doctor from branch
   * @route DELETE /api/branches/:id/doctors/:doctorId
   */
  static async removeDoctor(req, res, next) {
    try {
      const { id: branchId, doctorId } = req.params;

      // Check for future appointments
      const futureAppointments = await Appointment.findOne({
        where: {
          branchId,
          doctorId,
          date: {
            [Op.gte]: new Date()
          },
          status: {
            [Op.notIn]: ['cancelled']
          }
        }
      });

      if (futureAppointments) {
        throw new APIError(400, 'Cannot remove doctor with future appointments');
      }

      // Remove assignment
      const removed = await DoctorBranch.destroy({
        where: { branchId, doctorId }
      });

      if (!removed) {
        throw new APIError(404, 'Doctor is not assigned to this branch');
      }

      res.json({
        status: 'success',
        message: 'Doctor removed from branch successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get branch statistics
   * @route GET /api/branches/:id/statistics
   */
  static async getStatistics(req, res, next) {
    try {
      const branch = await Branch.findByPk(req.params.id);

      if (!branch) {
        throw new APIError(404, 'Branch not found');
      }

      // Get appointments statistics
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const appointments = await Appointment.findAll({
        where: {
          branchId: branch.id,
          date: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Get doctors count
      const doctorsCount = await DoctorBranch.count({
        where: { branchId: branch.id }
      });

      res.json({
        status: 'success',
        data: {
          appointments,
          doctorsCount,
          capacity: branch.capacity,
          currentStatus: await branch.getCurrentCapacity()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BranchController;