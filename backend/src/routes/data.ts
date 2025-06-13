import express from 'express';
import { analyticsService } from '../services/analyticsService';

const router = express.Router();

// Get all organizations
router.get('/organizations', async (req, res) => {
  try {
    const organizations = await analyticsService.getOrganizations();

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get last upload date for an organization
router.get('/last-upload/:organization', async (req, res) => {
  try {
    const { organization } = req.params;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
      return;
    }

    const lastUpload = await analyticsService.getLastUploadDate(
      decodeURIComponent(organization)
    );

    res.json({
      success: true,
      data: {
        organization: decodeURIComponent(organization),
        lastUpload,
      },
    });
  } catch (error) {
    console.error('Error fetching last upload date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch last upload date',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Clean up old data for an organization
router.delete('/cleanup/:organization', async (req, res) => {
  try {
    const { organization } = req.params;
    const { daysToKeep } = req.query;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
      return;
    }

    const daysToKeepNum = daysToKeep ? parseInt(daysToKeep as string, 10) : 90;
    if (isNaN(daysToKeepNum) || daysToKeepNum < 1 || daysToKeepNum > 365) {
      res.status(400).json({
        success: false,
        message: 'daysToKeep must be a number between 1 and 365',
      });
      return;
    }

    const result = await analyticsService.cleanupOldData(
      decodeURIComponent(organization),
      daysToKeepNum
    );

    res.json({
      success: true,
      message: 'Data cleanup completed successfully',
      data: {
        organization: decodeURIComponent(organization),
        daysToKeep: daysToKeepNum,
        ...result,
      },
    });
  } catch (error) {
    console.error('Error cleaning up data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
