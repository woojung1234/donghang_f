const WelfareService = require('../services/WelfareService');
const { validationResult } = require('express-validator');

class WelfareController {
  /**
   * @swagger
   * /api/v1/welfare:
   *   get:
   *     tags:
   *       - 복지 목록
   *     summary: 복지 목록 전체 조회
   *     description: 복지 목록을 전부 조회하는 API입니다.
   *     responses:
   *       200:
   *         description: 복지목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   welfareNo:
   *                     type: number
   *                     description: 복지 서비스 번호
   *                   welfareName:
   *                     type: string
   *                     description: 복지 서비스 이름
   *                   welfarePrice:
   *                     type: number
   *                     description: 복지 서비스 가격
   *                   welfareCategory:
   *                     type: string
   *                     description: 복지 서비스 카테고리
   *       404:
   *         description: 복지 목록이 존재하지 않습니다.
   *       500:
   *         description: 서버 오류로 인한 복지목록 조회 실패
   */
  static async readAll(req, res, next) {
    try {
      // 슬라이드에 표시되는 3개 서비스만 반환
      const slideServices = [
        {
          welfareNo: 1,
          welfareName: '일상가사 돌봄',
          welfarePrice: 50000,
          welfareCategory: '가사지원',
          welfareDescription: '주변 정리나 청소, 빨래, 밥짓기 등 일상가사 일을 힘들고 어려우신 어르신을 돕습니다'
        },
        {
          welfareNo: 2,
          welfareName: '가정간병 돌봄',
          welfarePrice: 80000,
          welfareCategory: '간병지원',
          welfareDescription: '의료진의 진료와 치료 외에도 항상 곁에서 누군가 돌봄주어야하나, 집에서 혼자 몸이 아프때에 어르신을 돕습니다'
        },
        {
          welfareNo: 3,
          welfareName: '정서지원 돌봄',
          welfarePrice: 0,
          welfareCategory: '정서지원',
          welfareDescription: '심리적,정서적 지원에 집중한 말벗, 산책 동행, 취미활동 보조 등으로 노인의 외로움과 우울감 해소를 도와드립니다'
        }
      ];

      console.log(`📋 Welfare list retrieved - Count: ${slideServices.length}`);

      res.status(200).json(slideServices);

    } catch (error) {
      console.error('❌ WelfareController.readAll Error:', error);
      res.status(500).json({
        message: '복지 목록 조회 중 서버 오류가 발생했습니다.'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/welfare/{welfareNo}:
   *   get:
   *     tags:
   *       - 복지 목록
   *     summary: 특정 복지 서비스 조회
   *     description: 특정 복지 서비스의 상세 정보를 조회합니다.
   *     parameters:
   *       - in: path
   *         name: welfareNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 복지 서비스 번호
   *     responses:
   *       200:
   *         description: 복지 서비스 조회 성공
   *       404:
   *         description: 해당 복지 서비스가 존재하지 않습니다.
   */
  static async readOne(req, res, next) {
    try {
      const { welfareNo } = req.params;
      const welfare = await WelfareService.getWelfareById(welfareNo);

      if (!welfare) {
        return res.status(404).json({
          message: '해당 복지 서비스가 존재하지 않습니다.'
        });
      }

      console.log(`🔍 Welfare service retrieved - WelfareNo: ${welfareNo}`);

      res.status(200).json(welfare);

    } catch (error) {
      console.error('❌ WelfareController.readOne Error:', error);
      res.status(500).json({
        message: '복지 서비스 조회 중 서버 오류가 발생했습니다.'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/welfare:
   *   post:
   *     tags:
   *       - 복지 목록
   *     summary: 복지 생성 [Not Use]
   *     description: 복지서비스를 생성하는 API입니다.
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - welfareName
   *               - welfarePrice
   *               - welfareCategory
   *             properties:
   *               welfareName:
   *                 type: string
   *                 description: 복지 서비스 이름
   *               welfarePrice:
   *                 type: number
   *                 description: 복지 서비스 가격
   *               welfareCategory:
   *                 type: string
   *                 description: 복지 서비스 카테고리
   *     responses:
   *       201:
   *         description: 복지목록 생성 성공
   *       500:
   *         description: 서버 오류로 인한 복지목록 생성 실패
   */
  static async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { welfareName, welfarePrice, welfareCategory } = req.body;

      const welfareNo = await WelfareService.createWelfare({
        welfareName,
        welfarePrice,
        welfareCategory
      });

      console.log(`✅ Welfare service created - WelfareNo: ${welfareNo}, Name: ${welfareName}`);

      res.status(201).json({
        message: '복지 서비스가 성공적으로 생성되었습니다.',
        welfareNo
      });

    } catch (error) {
      console.error('❌ WelfareController.create Error:', error);
      res.status(500).json({
        message: '복지 서비스 생성 중 서버 오류가 발생했습니다.'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/welfare:
   *   put:
   *     tags:
   *       - 복지 목록
   *     summary: 복지 수정 [Not Use]
   *     description: 복지서비스를 수정하는 API입니다.
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - welfareNo
   *               - welfareName
   *               - welfarePrice
   *               - welfareCategory
   *             properties:
   *               welfareNo:
   *                 type: number
   *                 description: 복지 서비스 번호
   *               welfareName:
   *                 type: string
   *                 description: 복지 서비스 이름
   *               welfarePrice:
   *                 type: number
   *                 description: 복지 서비스 가격
   *               welfareCategory:
   *                 type: string
   *                 description: 복지 서비스 카테고리
   *     responses:
   *       200:
   *         description: 복지목록 수정 성공
   *       404:
   *         description: 해당 복지 서비스가 존재하지 않습니다.
   *       500:
   *         description: 서버 오류로 인한 복지목록 수정 실패
   */
  static async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: '입력 데이터가 올바르지 않습니다.',
          errors: errors.array()
        });
      }

      const { welfareNo, welfareName, welfarePrice, welfareCategory } = req.body;

      const updated = await WelfareService.updateWelfare(welfareNo, {
        welfareName,
        welfarePrice,
        welfareCategory
      });

      if (!updated) {
        return res.status(404).json({
          message: '해당 복지 서비스가 존재하지 않습니다.'
        });
      }

      console.log(`🔄 Welfare service updated - WelfareNo: ${welfareNo}`);

      res.status(200).json({
        message: '복지 서비스가 성공적으로 수정되었습니다.'
      });

    } catch (error) {
      console.error('❌ WelfareController.update Error:', error);
      res.status(500).json({
        message: '복지 서비스 수정 중 서버 오류가 발생했습니다.'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/welfare/{welfareNo}:
   *   delete:
   *     tags:
   *       - 복지 목록
   *     summary: 복지 삭제 [Not Use]
   *     description: 복지서비스를 삭제하는 API입니다.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: welfareNo
   *         required: true
   *         schema:
   *           type: number
   *         description: 복지 서비스 번호
   *     responses:
   *       200:
   *         description: 복지목록 삭제 성공
   *       404:
   *         description: 해당 복지 서비스가 존재하지 않습니다.
   *       500:
   *         description: 서버 오류로 인한 복지목록 삭제 실패
   */
  static async delete(req, res, next) {
    try {
      const { welfareNo } = req.params;

      const deleted = await WelfareService.deleteWelfare(welfareNo);

      if (!deleted) {
        return res.status(404).json({
          message: '해당 복지 서비스가 존재하지 않습니다.'
        });
      }

      console.log(`🗑️ Welfare service deleted - WelfareNo: ${welfareNo}`);

      res.status(200).json({
        message: '복지 서비스가 성공적으로 삭제되었습니다.'
      });

    } catch (error) {
      console.error('❌ WelfareController.delete Error:', error);
      res.status(500).json({
        message: '복지 서비스 삭제 중 서버 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = WelfareController;
